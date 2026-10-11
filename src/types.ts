export interface RugShieldScanResult {
  token: string;
  symbol: string;
  name: string;
  decimals: number;
  is_honeypot: boolean;
  buy_tax_bps: number;
  sell_tax_bps: number;
  liquidity_usd: number;
  risk_score: number;
  risk_factors?: string[];
  recommendation: "SAFE_TO_SWAP" | "HIGH_RISK_BLOCK" | "CAUTION";
  attestation: string;
  timestamp: number;
}

export interface TradeConfig {
  rpcUrl: string;
  privateKey?: `0x${string}`;
  rugshieldEndpoint: string;
  maxBuyAmountEth: string;
  slippageBps: number;
  maxAllowedTaxBps: number;
  minLiquidityUsd: number;
  dex: "aerodrome" | "uniswap-v3";
}

export interface SwapExecutionReceipt {
  success: boolean;
  txHash?: string;
  tokenAddress: string;
  symbol: string;
  amountInEth: string;
  estimatedAmountOut: string;
  slippageBps: number;
  router: string;
  timestamp: number;
  simulationOnly: boolean;
}
