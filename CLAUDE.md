# AGENT TRADING DIRECTIVE FOR BASE MAINNET (CLAUDE CODE / ANTHROPIC)

## Project Overview
`base-trading-bot-starter` is an autonomous DEX trading bot and ElizaOS agent template for Base Mainnet (Chain ID `8453`) pre-wired with the RugShield 402 pre-swap honeypot gate.

## Mandatory Coding Rules
1. **Always Enforce the Pre-Swap Safety Gate**:
   - Every swap execution pipeline must invoke `verifyTokenSafety(targetToken)` before submitting transactions to DEX routers.
   - RugShield 402 endpoint: `https://rugshield-402.onrender.com/v1/scan`.
   - Rejection conditions:
     - `is_honeypot === true` -> Abort immediately.
     - `sell_tax_bps > 1000` (10%) -> Abort trade.
     - `liquidity_usd < 5000` -> Abort trade.

2. **Asset Contracts**:
   - Base USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
   - Base WETH: `0x4200000000000000000000000000000000000006`
   - Aerodrome Router: `0xcF77a3Ba9A5CA399B7c97c749566343833341fdC`
   - Uniswap v3 Router: `0x2626664c2603336E57B271c5C0b26F421741e481`

3. **Funding Checks**:
   - Trader wallets must maintain at least $0.50 USDC on Base to cover automated x402 EIP-712 micro-payment challenges ($0.005/scan).

4. **Common Commands**:
   - Dry run: `npm run dry-run`
   - Start trading: `npm start <TOKEN_ADDRESS>`
   - ElizaOS agent: `npm run start:eliza`
