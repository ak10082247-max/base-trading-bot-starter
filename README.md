# Base Trading Bot Starter 🚀

[![Network: Base Mainnet](https://img.shields.io/badge/Network-Base%20Mainnet%20(8453)-0052FF.svg)](https://base.org)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg)](https://www.typescriptlang.org)
[![x402 Protocol](https://img.shields.io/badge/Security-RugShield%20402-10B981.svg)](https://rugshield-402.onrender.com)
[![npm](https://img.shields.io/badge/npm-%40kurox__real%2Fagentkit--rugshield--402-CB3837.svg)](https://www.npmjs.com/package/@kurox_real/agentkit-rugshield-402)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Production-Ready Autonomous Trading Bot Template for Base Mainnet with Built-in Honeypot & Rug-Pull Protection (Powered by RugShield 402).**

Stop losing capital to un-sellable honeypot traps, hidden 99% transfer taxes, and malicious liquidity pulls. This starter repository gives developers, algorithmic traders, and AI agent builders an out-of-the-box trading loop that audits every target contract via **[RugShield 402](https://rugshield-402.onrender.com)** before broadcasting any swap to the Base mempool.

---

## ⚡ The Architecture: Cryptographic Pre-Swap Gate

Standard sniper bots swap first and find out they were rugged later. **Base Trading Bot Starter** intercepts the execution pipeline with an automated HTTP 402 micro-payment safety gate:

```
┌─────────────────────────┐
│ Target Token Discovery  │ (CLI input, pool listener, or AI agent)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ RugShield 402 Gate      │ ──► POST https://rugshield-402.onrender.com/v1/scan
│ (Monetized x402 Micropay)│      (Cryptographic EIP-712 auth: $0.005 USDC)
└────────────┬────────────┘
             │
      ┌──────┴─────────────────────────┐
      │                                │
[FAIL: Honeypot / Tax > 10%]    [PASS: Safe & Liquid]
      │                                │
      ▼                                ▼
┌─────────────────────────┐     ┌───────────────────────────────────┐
│ 🛑 ABORT SWAP           │     │ ⚡ EXECUTE SWAP                    │
│ Zero gas or ETH spent.  │     │ Aerodrome Router / Uniswap v3     │
│ Wallet 100% Protected.  │     │ Base Mainnet (8453)               │
└─────────────────────────┘     └───────────────────────────────────┘
```

---

## 🚀 Quickstart (30 Seconds)

### 1. Clone & Install
```bash
git clone https://github.com/ak10082247-max/base-trading-bot-starter.git
cd base-trading-bot-starter
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

*(The `.env.example` comes pre-configured with Base Mainnet RPC and safe default parameters. No private key is needed to run simulations.)*

### 3. Run Zero-Risk Dry Run
```bash
npm run dry-run
```

You will see:
1. Live RPC connection to Base Mainnet (`https://mainnet.base.org`).
2. Live pre-swap honeypot audit for DEGEN token (`0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed`).
3. Tax verification and USD liquidity checks.
4. Simulated swap calculation with slippage tolerance.

---

## 💻 Running the Trading Bot

### Scan and Swap a Specific Token
```bash
# Trade DEGEN on Base Mainnet
npm start 0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed

# Or target any custom token on Base
npm start <TOKEN_ADDRESS>
```

### Live Trading Mode
To broadcast live transactions to the Base mempool:
1. Open `.env`
2. Add your funded Base private key:
   ```env
   TRADER_PRIVATE_KEY="0x..."
   MAX_BUY_AMOUNT_ETH="0.005"
   ```
3. Run `npm start <TOKEN_ADDRESS>`

---

## 🛡️ Built-in Safety Parameters

Configure your risk tolerance in `.env`:

| Parameter | Default | Description |
|---|---|---|
| `MAX_BUY_AMOUNT_ETH` | `0.005` | Maximum ETH to commit per trade |
| `SLIPPAGE_TOLERANCE_BPS` | `100` | 1.0% maximum allowed price slippage |
| `MAX_ALLOWED_TAX_BPS` | `1000` | Abort trade if sell tax exceeds 10% |
| `MIN_LIQUIDITY_USD` | `5000` | Abort trade if pool liquidity is under $5,000 |
| `DEX_ROUTER` | `aerodrome` | Supported: `aerodrome` or `uniswap-v3` |
| `RUGSHIELD_ENDPOINT` | `https://rugshield-402.onrender.com/v1/scan` | x402 Honeypot detection gate |

---

## 📦 Powered by Official RugShield 402 Packages

This template is built on top of the official RugShield ecosystem:
- **npm Package**: [`@kurox_real/agentkit-rugshield-402`](https://www.npmjs.com/package/@kurox_real/agentkit-rugshield-402)
- **Live Cloud API**: [https://rugshield-402.onrender.com](https://rugshield-402.onrender.com)
- **Web DApp Scanner**: [https://ak10082247-max.github.io/rugshield-402/](https://ak10082247-max.github.io/rugshield-402/)
- **Telegram Scanner**: [@RugShield402_bot](https://t.me/RugShield402_bot)
- **Agent Protocol**: RFC/x402 AI-to-AI micro-payments on Base

---

## 📜 License

MIT License. Free to fork, customize, and deploy in your autonomous trading stack.
