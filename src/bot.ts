import chalk from "chalk";
import { CONFIG } from "./config.js";
import { verifyTokenSafety } from "./safety.js";
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
