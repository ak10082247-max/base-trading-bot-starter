import chalk from "chalk";
import { createWalletClient, createPublicClient, http, erc20Abi, Address, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { randomBytes } from "node:crypto";
import { CONFIG, KNOWN_ADDRESSES, BASE_CHAIN_ID } from "./config.js";
import { RugShieldScanResult } from "./types.js";

const DEFAULT_MERCHANT = "0x80E0Ae84679b7f11bE171DaADd492FBECf628cd6" as const;

export interface SafetyCheckResult {
  isSafe: boolean;
  reason?: string;
  report?: RugShieldScanResult | null;
}

/**
 * Checks if the trader's wallet on Base holds enough USDC for x402 pre-swap simulations ($0.010 USDC)
 */
export async function checkUsdcBalance(
  traderAddress: Address
): Promise<{ balance: bigint; formatted: string; hasEnough: boolean }> {
  const publicClient = createPublicClient({
    chain: base,
    transport: http(CONFIG.rpcUrl),
  });

  try {
    const balance = await publicClient.readContract({
      address: KNOWN_ADDRESSES.USDC,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [traderAddress],
    });

    const formatted = formatUnits(balance, 6);
    const hasEnough = balance >= 10000n; // 0.010 USDC minimum

    return { balance, formatted, hasEnough };
  } catch (err: any) {
    console.warn(chalk.yellow(`   ⚠️ Could not query USDC balance: ${err.message}`));
    return { balance: 0n, formatted: "0.00", hasEnough: false };
  }
}


/**
 * Creates EIP-712 transfer authorization header for x402 v2 payment challenge ($0.010 USDC)
 */
async function generatePaymentHeader(privateKey: `0x${string}`, priceUnits: bigint = 10000n) {
  const account = privateKeyToAccount(privateKey);
  const nonce = `0x${randomBytes(32).toString("hex")}` as `0x${string}`;
  const validAfter = 0n;
  const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
  const amount = priceUnits; // 10000n = 0.010 USDC

  const domain = {
    name: "USD Coin",
    version: "2",
    chainId: BASE_CHAIN_ID,
    verifyingContract: KNOWN_ADDRESSES.USDC,
  };

  const types = {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  };

  const message = {
    from: account.address,
    to: DEFAULT_MERCHANT,
    value: amount,
    validAfter,
    validBefore,
    nonce,
  };

  const client = createWalletClient({
    account,
    chain: base,
    transport: http(CONFIG.rpcUrl),
  });

  const signature = await client.signTypedData({
    domain,
    types,
    primaryType: "TransferWithAuthorization",
    message,
  });

  const v2Payload = {
    x402Version: 2,
    resource: {
      url: CONFIG.rugshieldEndpoint,
    },
    accepted: {
      scheme: "exact",
      network: "eip155:8453",
      amount: amount.toString(),
      asset: KNOWN_ADDRESSES.USDC,
      payTo: DEFAULT_MERCHANT,
      maxTimeoutSeconds: 300,
      extra: { name: "USD Coin", version: "2" },
    },
    payload: {
      signature,
      authorization: {
        from: account.address,
        to: DEFAULT_MERCHANT,
        value: amount.toString(),
        validAfter: validAfter.toString(),
        validBefore: validBefore.toString(),
        nonce,
      },
    },
  };

  return Buffer.from(JSON.stringify(v2Payload)).toString("base64");
}

/**
 * The RugShield 402 Safety Gate
 * Audits tokens for honeypot traps, excessive taxes, and low liquidity before executing swaps.
 */
export async function verifyTokenSafety(
  tokenAddress: string,
  options?: { isDryRun?: boolean }
): Promise<SafetyCheckResult> {
  console.log(chalk.cyan(`\n🔍 [RugShield-402] Initiating pre-swap safety audit...`));
  console.log(chalk.gray(`   Target Token: ${tokenAddress}`));
  console.log(chalk.gray(`   Gate Endpoint: ${CONFIG.rugshieldEndpoint}`));

  let report: RugShieldScanResult | null = null;
  const isDryRun = options?.isDryRun ?? false;

  // 1. If live key configured and not in dry-run, generate x402 payment authorization header
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (CONFIG.privateKey && !isDryRun) {
    try {
      const paymentHeader = await generatePaymentHeader(CONFIG.privateKey, 10000n);
      headers["PAYMENT-SIGNATURE"] = paymentHeader;
      headers["X-PAYMENT-SIGNATURE"] = paymentHeader;
      headers["X-PAYMENT"] = paymentHeader;
      console.log(chalk.magenta(`   💳 x402 V2 Payment Authorization attached ($0.010 USDC -> Merchant Wallet)`));
    } catch (err: any) {
      console.warn(chalk.yellow(`   ⚠️ Could not sign x402 header: ${err.message}`));
    }
  }

  // 2. Fetch audit report from RugShield 402 endpoint
  try {
    const res = await fetch(CONFIG.rugshieldEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        token_address: tokenAddress,
        chain_id: BASE_CHAIN_ID,
        simulate_sell: true,
      }),
    });

    if (res.status === 200) {
      report = (await res.json()) as RugShieldScanResult;
    } else if (res.status === 402 && isDryRun) {
      // In dry-run mode without payment, query the free public preview endpoint honestly
      console.log(chalk.gray(`   ℹ️ Direct 402 challenged. Querying public /v1/scan/preview endpoint...`));
      const previewUrl = CONFIG.rugshieldEndpoint.replace(/\/v1\/scan(?:\?.*)?$/, "/v1/scan/preview");
      const previewRes = await fetch(previewUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          token_address: tokenAddress,
          chain: "base",
          simulate_sell: true,
        }),
      });

      if (previewRes.ok) {
        report = (await previewRes.json()) as RugShieldScanResult;
      }
    }
  } catch (err: any) {
    console.warn(chalk.yellow(`   ⚠️ Network connection to RugShield API: ${err.message}`));
  }

  if (!report) {
    const reason = isDryRun
      ? "RugShield preview endpoint unavailable; fail-closed without synthetic simulation data."
      : "RugShield paid /v1/scan audit unavailable or returned 402 Payment Required.";
    console.log(chalk.red.bold(`❌ [BLOCKED] ${reason}`));
    return { isSafe: false, reason, report: null };
  }

  const buyTaxLabel = typeof report.buy_tax_bps === "number" ? `${report.buy_tax_bps / 100}%` : "N/A (paid /v1/scan required)";
  const sellTaxLabel = typeof report.sell_tax_bps === "number" ? `${report.sell_tax_bps / 100}%` : "N/A (paid /v1/scan required)";
  const liqLabel = typeof report.liquidity_usd === "number" ? `$${report.liquidity_usd.toLocaleString()}` : "N/A (paid /v1/scan required)";
  const riskLabel = typeof report.risk_score === "number" ? `${report.risk_score}/100` : "N/A";
  const honeypotLabel =
    report.is_honeypot === true
      ? chalk.bgRed.white(" YES - FATAL ")
      : report.is_honeypot === false
      ? chalk.green("NO (Pass)")
      : chalk.yellow(`UNVERIFIED (${report.simulation_status || "paid /v1/scan required"})`);

  // Display audit summary
  console.log(chalk.bold(`\n============= 🛡️ RUGSHIELD 402 AUDIT RECEIPT =============`));
  console.log(` Token:          ${chalk.yellow(report.symbol || "UNKNOWN")} (${report.token || tokenAddress})`);
  console.log(` Honeypot Trap:  ${honeypotLabel}`);
  console.log(` Buy / Sell Tax: ${buyTaxLabel} / ${sellTaxLabel}`);
  console.log(` Liquidity USD:  ${liqLabel}`);
  console.log(` Risk Score:     ${riskLabel}`);
  console.log(` Verdict:        ${report.recommendation === "SAFE_TO_SWAP" ? chalk.bgGreen.black(" SAFE_TO_SWAP ") : chalk.bgRed.white(` ${report.recommendation || report.simulation_status || "UNVERIFIED"} `)}`);
  console.log(` Attestation:    ${chalk.gray(report.attestation ? report.attestation.slice(0, 24) + "..." : "none (unpaid preview)")}`);
  console.log(chalk.bold(`===========================================================\n`));

  // The Fail-Closed Safety Checks
  if (report.is_honeypot !== false) {
    const reason =
      report.is_honeypot === true
        ? `CRITICAL ALERT: Token is an on-chain Honeypot trap! Sell order cannot execute.`
        : `Honeypot simulation not verified (${report.simulation_status || "paid /v1/scan required"}). Failing closed.`;
    console.log(chalk.red.bold(`❌ [BLOCKED] ${reason}`));
    return { isSafe: false, reason, report };
  }

  if (typeof report.sell_tax_bps !== "number" || report.sell_tax_bps > CONFIG.maxAllowedTaxBps) {
    const reason =
      typeof report.sell_tax_bps === "number"
        ? `Excessive sell tax (${report.sell_tax_bps / 100}%). Limit is ${CONFIG.maxAllowedTaxBps / 100}%.`
        : `Sell tax missing from report; failing closed.`;
    console.log(chalk.red.bold(`❌ [BLOCKED] ${reason}`));
    return { isSafe: false, reason, report };
  }

  if (typeof report.liquidity_usd !== "number" || report.liquidity_usd < CONFIG.minLiquidityUsd) {
    const reason =
      typeof report.liquidity_usd === "number"
        ? `Insufficient pool liquidity ($${report.liquidity_usd.toLocaleString()} < $${CONFIG.minLiquidityUsd.toLocaleString()}). High slippage risk.`
        : `Pool liquidity unverified; failing closed.`;
    console.log(chalk.red.bold(`❌ [BLOCKED] ${reason}`));
    return { isSafe: false, reason, report };
  }

  if (report.recommendation === "HIGH_RISK_BLOCK") {
    const reason = `Risk engine evaluated token as HIGH_RISK_BLOCK.`;
    console.log(chalk.red.bold(`❌ [BLOCKED] ${reason}`));
    return { isSafe: false, reason, report };
  }

  console.log(chalk.green.bold(`✅ [PASSED] Token cleared all safety checks. Authorized for swap execution.`));
  return { isSafe: true, report };
}
