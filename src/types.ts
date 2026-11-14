export interface RugShieldScanResult {
  token: string;
  symbol?: string | null;
  name?: string | null;
  decimals?: number | null;
  is_honeypot: boolean | null;
  buy_tax_bps: number | null;
  sell_tax_bps: number | null;
  liquidity_usd: number | null;
  risk_score: number | null;
  risk_factors?: string[];
  simulation_status?: string;
  recommendation?: "SAFE_TO_SWAP" | "HIGH_RISK_BLOCK" | "CAUTION" | string;
  attestation?: string | null;
  timestamp?: number;
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
