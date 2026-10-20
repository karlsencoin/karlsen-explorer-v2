// Response shapes of karlsen-explorer-api (wire-compatible with legacy rest-v2).
// Large integers (sompi, DAA score, blue score) arrive as strings or JSON numbers;
// they are converted to bigint at the edge, never to float.

export interface BlockDagInfo {
  networkName: string;
  blockCount: string;
  headerCount: string;
  tipHashes: string[];
  difficulty: number;
  pastMedianTime: string;
  virtualParentHashes: string[];
  pruningPointHash: string;
  virtualDaaScore: string;
  sink: string;
}

export interface CoinSupply {
  circulatingSupply: string; // sompi
  maxSupply: string; // sompi
}

export interface BlockReward {
  blockreward: number; // KLS
}

export interface Halving {
  nextHalvingTimestamp: number; // unix seconds
  nextHalvingDate: string;
  nextHalvingAmount: number; // KLS
}

export interface KarlsendInfo {
  mempoolSize: string;
  serverVersion: string;
  isUtxoIndexed: boolean;
  isSynced: boolean;
  p2pIdHashed: string;
}

export interface Hashrate {
  hashrate: number; // TH/s
}

export interface Usd {
  usd: number;
}

export interface MarketData {
  current_price: Usd;
  price_change_percentage_24h: number;
  high_24h: Usd;
  low_24h: Usd;
  total_volume: Usd;
  market_cap: Usd;
  circulating_supply: number;
  previous_day_price: number;
  price_direction: string;
}

export interface Outpoint {
  transactionId: string;
  index: number;
}

export interface TxInput {
  previousOutpoint: Outpoint;
  signatureScript: string;
  sigOpCount: number;
  sequence: number;
}

export interface TxOutput {
  amount: number | string; // sompi
  scriptPublicKey: { scriptPublicKey: string; version: number };
  verboseData: { scriptPublicKeyType: string; scriptPublicKeyAddress: string };
}

export interface Transaction {
  inputs: TxInput[];
  outputs: TxOutput[];
  subnetworkId: string;
  payload: string;
  verboseData: {
    transactionId: string;
    hash: string;
    computeMass: number;
    blockHash: string;
    blockTime: number; // unix ms
  };
}

export interface Block {
  header: {
    timestamp: string; // unix ms
    daaScore: string;
    blueScore: string;
    blueWork: string;
  };
  transactions: Transaction[] | null;
  verboseData: {
    hash: string;
    difficulty: number;
    selectedParentHash: string;
    transactionIds: string[];
    blueScore: string;
    isChainBlock: boolean;
  };
  extra: {
    color: string | null;
    minerAddress: string | null;
    minerInfo: string | null;
  };
}
