import "dotenv/config";
import { TradeConfig } from "./types.js";

export const BASE_CHAIN_ID = 8453;

export const KNOWN_ADDRESSES = {
  WETH: "0x4200000000000000000000000000000000000006" as `0x${string}`,
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
  AERODROME_ROUTER: "0xcF77a3Ba9A5CA399B7c97c749566343833341fdC" as `0x${string}`,
  UNISWAP_V3_ROUTER: "0x2626664c2603336E57B271c5C0b26F421741e481" as `0x${string}`,
};

export const CONFIG: TradeConfig = {
  rpcUrl: process.env.BASE_RPC_URL || "https://mainnet.base.org",
  privateKey: process.env.TRADER_PRIVATE_KEY as `0x${string}` | undefined,
  rugshieldEndpoint:
    process.env.RUGSHIELD_ENDPOINT || "https://rugshield-402.onrender.com/v1/scan",
  maxBuyAmountEth: process.env.MAX_BUY_AMOUNT_ETH || "0.005",
  slippageBps: parseInt(process.env.SLIPPAGE_TOLERANCE_BPS || "100", 10),
  maxAllowedTaxBps: parseInt(process.env.MAX_ALLOWED_TAX_BPS || "1000", 10), // 10%
  minLiquidityUsd: parseInt(process.env.MIN_LIQUIDITY_USD || "5000", 10), // $5,000
  dex: (process.env.DEX_ROUTER as "aerodrome" | "uniswap-v3") || "aerodrome",
};
