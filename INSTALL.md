# 📘 BaseSniper Pro — Installation & Quickstart Manual

## Prerequisites
- **Node.js**: v18.0.0 or higher (`node -v`)
- **NPM**: v9.0.0 or higher (`npm -v`)
- **A funded Base Mainnet wallet**: Needs a small amount of ETH for gas (e.g. $2 - $5) and USDC for trading capital.
- **Base RPC URL**: Free public RPC (`https://mainnet.base.org`) or private RPC from Alchemy / Infura / QuickNode.

---

## 🚀 Quick Setup (3 Minutes)

### Step 1: Unzip & Install
```bash
unzip BaseSniper_Pro_v1.0.0.zip
cd BaseSniper_Pro
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` in any text editor and fill in your settings:
```ini
# Base RPC endpoint (Base Mainnet chain ID 8453)
RPC_URL="https://mainnet.base.org"

# Your trading wallet private key (never share this)
PRIVATE_KEY="0x..."

# Trading parameters
MAX_SLIPPAGE_BPS=100        # 1.0% maximum slippage
MAX_BUY_TAX_BPS=500          # 5.0% maximum buy tax allowed
MAX_SELL_TAX_BPS=500         # 5.0% maximum sell tax allowed
MIN_LIQUIDITY_USD=1000       # Minimum pool liquidity required

# Safety Gate endpoint (Optional: RugShield pre-trade honeypot simulation)
RUGSHIELD_ENABLED=true
RUGSHIELD_API_URL="https://rugshield-402.onrender.com"
```

### Step 3: Run in Dry-Run Simulation Mode (Zero Risk)
Before putting any real money at risk, test your configuration in Dry-Run mode:
```bash
npm run dry-run
```
This simulates:
- Connecting to Base Mainnet RPC
- Verifying your wallet balance and network connectivity
- Simulating sample token swaps against Aerodrome liquidity
- Pre-trade honeypot detection with zero real ETH or USDC spent

### Step 4: Launch Live Bot
When you are ready to begin live trading:
```bash
npm start
```

---

## ⚙️ Architecture & Safety Pipeline

```
[ New Token / Target Detected ]
              │
              ▼
[ Pre-Trade Bytecode Simulation ] ──> Is Sell Tax > 5%? ──> [ ABORT: Zero Gas Lost ]
              │
              ├──> Is Token Honeypot? ──> [ ABORT: Zero Gas Lost ]
              │
              ├──> Is Liquidity Locked? ──> [ ABORT: Unverified LP ]
              │
              ▼ (ALL CHECKS PASS)
[ Atomic Swap via Aerodrome Router ]
              │
              ▼
[ Cryptographic Execution Receipt ]
```

---

## ❓ Frequently Asked Questions (FAQ)

### Can I run this on a cheap VPS or Raspberry Pi?
Yes! BaseSniper Pro uses less than 150MB of RAM and runs smoothly on any Linux (Ubuntu/Debian), macOS, or Windows VPS (e.g. DigitalOcean $4/mo droplet).

### Does this require monthly API subscriptions?
No! It runs completely self-hosted using public or free-tier RPCs.

### Can I customize the trading strategy?
Yes! The source code is 100% open TypeScript. Modify `src/bot.ts` to add custom technical indicators, DCA loops, or volume filters.

---

## 🛡️ Support & Warranty
For bug reports or questions, refer to the documentation or reach out via your marketplace order page.
