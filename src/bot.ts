import chalk from "chalk";
import { privateKeyToAccount } from "viem/accounts";
import { CONFIG, KNOWN_ADDRESSES } from "./config.js";
import { verifyTokenSafety, checkUsdcBalance } from "./safety.js";
import { executeSwap } from "./executor.js";

async function main() {
  console.log(chalk.bold.cyan(`
╔═══════════════════════════════════════════════════════════════╗
║          BASE TRADING BOT STARTER (RUGSHIELD-402)             ║
║  Autonomous DEX Trading & Sniper with Honeypot Protection     ║
╚═══════════════════════════════════════════════════════════════╝`));

  console.log(` Network:          Base Mainnet (Chain ID 8453)`);
  console.log(` Router:           ${CONFIG.dex.toUpperCase()}`);
  console.log(` Max Buy:          ${CONFIG.maxBuyAmountEth} ETH`);
  console.log(` Max Sell Tax:     ${CONFIG.maxAllowedTaxBps / 100}%`);
  console.log(` Min Liquidity:    $${CONFIG.minLiquidityUsd.toLocaleString()}`);
  console.log(` Safety Gate:      RugShield 402 (${CONFIG.rugshieldEndpoint})`);

  // Pre-flight USDC balance gate for live trading wallets
  if (CONFIG.privateKey) {
    try {
      const traderAccount = privateKeyToAccount(CONFIG.privateKey);
      console.log(` Trader Wallet:    ${traderAccount.address}`);
      console.log(chalk.cyan(`\n💳 Verifying trader USDC micro-balance on Base...`));
      const usdcStatus = await checkUsdcBalance(traderAccount.address);
      console.log(`   USDC Balance:   ${usdcStatus.formatted} USDC`);

      if (!usdcStatus.hasEnough) {
        console.log(chalk.bold.red(`
╔══════════════════════════════════════════════════════════════════╗
║ ⚠️ CRITICAL CONFIGURATION REQUIREMENT: ZERO USDC DETECTED        ║
╚══════════════════════════════════════════════════════════════════╝
Your trader wallet holds ${usdcStatus.formatted} USDC on Base Mainnet.
RugShield 402 requires $0.005 USDC per on-chain pre-swap simulation.

👉 ACTION REQUIRED:
Send at least $0.50 - $1.00 USDC to your bot wallet on Base:
Address: ${traderAccount.address}
Asset: ${KNOWN_ADDRESSES.USDC} (USDC on Base)
════════════════════════════════════════════════════════════════════`));
        process.exit(1);
      }
      console.log(chalk.green(`   ✓ Sufficient USDC balance for automated x402 safety checks.`));
    } catch (err: any) {
      console.warn(chalk.yellow(`   ⚠️ Could not derive wallet address from TRADER_PRIVATE_KEY: ${err.message}`));
    }
  } else {
    console.log(chalk.gray(` Mode:             Simulation / Dry-Run (No TRADER_PRIVATE_KEY detected)`));
  }

  // 1. Target Token Selection (CLI arg or default safe benchmark DEGEN on Base)
  const targetToken = (
    process.argv[2] || "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed"
  ).trim();

  if (!targetToken.startsWith("0x") || targetToken.length !== 42) {
    console.error(chalk.red(`\n❌ Invalid token address format: "${targetToken}". Must be 42 characters hex.`));
    process.exit(1);
  }

  console.log(chalk.yellow(`\n🎯 Target Token Selected: ${targetToken}`));

  // 2. The RugShield Safety Gate (Monetization & Protection Layer)
  const safety = await verifyTokenSafety(targetToken, { isDryRun: false });

  if (!safety.isSafe) {
    console.log(chalk.bold.red(`\n⛔ TRADE ABORTED BY RUGSHIELD SAFETY GATE:`));
    console.log(chalk.red(`   Reason: ${safety.reason}`));
    console.log(chalk.yellow(`   Your wallet funds remain 100% safe. No gas or swap funds spent.\n`));
    process.exit(1);
  }

  // 3. Swap Execution
  console.log(chalk.green(`\n🚀 Proceeding with swap execution for ${safety.report.symbol || targetToken}...`));
  const receipt = await executeSwap({
    tokenAddress: targetToken as `0x${string}`,
    tokenSymbol: safety.report.symbol || "TOKEN",
    amountInEth: CONFIG.maxBuyAmountEth,
    isDryRun: !CONFIG.privateKey,
  });

  // 4. Trade Summary
  console.log(chalk.bold.magenta(`\n================= TRADE EXECUTION RECEIPT =================`));
  console.log(` Status:           ${receipt.success ? chalk.green("SUCCESS") : chalk.red("FAILED")}`);
  console.log(` Token:            ${receipt.symbol} (${receipt.tokenAddress})`);
  console.log(` Amount In:        ${receipt.amountInEth} ETH`);
  console.log(` Est. Received:    ${receipt.estimatedAmountOut} ${receipt.symbol}`);
  console.log(` Router:           ${receipt.router}`);
  if (receipt.txHash) {
    console.log(` Tx Hash:          ${receipt.txHash}`);
    console.log(` BaseScan:         https://basescan.org/tx/${receipt.txHash}`);
  } else {
    console.log(` Execution Mode:   Simulation / Dry-Run (Set TRADER_PRIVATE_KEY for live mempool)`);
  }
  console.log(chalk.bold.magenta(`===========================================================\n`));
}

main().catch((err) => {
  console.error(chalk.red(`\n❌ Fatal bot runtime error: ${err.message}`));
  process.exit(1);
});
