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
    version: number;
    hashMerkleRoot: string;
    acceptedIdMerkleRoot: string;
    utxoCommitment: string;
    timestamp: string; // unix ms
    bits: number;
    nonce: string;
    daaScore: string;
    blueScore: string;
    blueWork: string;
    pruningPoint: string;
    parents: { parentHashes: string[] }[];
  };
  transactions: Transaction[] | null;
  verboseData: {
    hash: string;
    difficulty: number;
    selectedParentHash: string;
    transactionIds: string[];
    blueScore: string;
    childrenHashes: string[];
    mergeSetBluesHashes: string[];
    mergeSetRedsHashes: string[];
    isChainBlock: boolean;
  };
  extra: {
    color: string | null;
    minerAddress: string | null;
    minerInfo: string | null;
  };
}

// ---- transactions (rest-v2 shape: snake_case, addresses without the prefix) ----

export interface TxOutputJson {
  transaction_id: string;
  index: number;
  amount: number; // sompi
  script_public_key: string;
  script_public_key_address: string | null;
  script_public_key_type: string;
}

export interface TxInputJson {
  transaction_id: string;
  index: number;
  previous_outpoint_hash: string;
  previous_outpoint_index: string;
  previous_outpoint_address: string | null;
  previous_outpoint_amount: number | null; // sompi, with resolve_previous_outpoints=light
  signature_script: string | null;
  sig_op_count: string | null;
}

export interface TxJson {
  subnetwork_id: string | null;
  transaction_id: string;
  hash: string | null;
  mass: string | null;
  payload: string | null;
  block_hash: string[];
  block_time: number | null; // unix ms
  is_accepted: boolean;
  accepting_block_hash: string | null;
  accepting_block_blue_score: number | null;
  accepting_block_time: number | null;
  inputs: TxInputJson[] | null;
  outputs: TxOutputJson[] | null;
}

export interface AddressBalance {
  address: string;
  balance: number; // sompi
}

export interface Utxo {
  address: string;
  outpoint: { transactionId: string; index: number };
  utxoEntry: {
    amount: string; // sompi
    scriptPublicKey: { scriptPublicKey: string };
    blockDaaScore: string;
    isCoinbase: boolean;
  };
}

export interface UtxoPage {
  items: Utxo[];
  total: number;
  totalAmount: bigint; // sompi
}
