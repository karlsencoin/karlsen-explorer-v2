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

// ---- analytics (balances table; amounts in KLS as floats, as legacy) ----

export interface RichEntry {
  address: string; // without the "karlsen:" prefix in legacy rows
  amount: number; // KLS
  percent: number; // of total balance
  delta_24h: number | null; // KLS vs the latest daily snapshot
  is_new: boolean | null;
}

export interface TierEntry {
  tier: string; // "10M+", "1M-10M", ...
  addresses: number;
  balance_kls: number;
  balance_percent: number;
  delta_1d: number | null;
  delta_7d: number | null;
  delta_1d_kls: number | null;
  delta_7d_kls: number | null;
}

export interface DistributionSummary {
  total_addresses: number;
  total_balance_kls: number;
  total_delta_1d: number | null;
  total_delta_7d: number | null;
  total_delta_1d_kls: number | null;
  total_delta_7d_kls: number | null;
  tiers: TierEntry[];
}

// ---- bridge reserves (karlsen-bridge-reserves service) ----

export interface BridgeReserves {
  status: "OK" | "UNDERCOLLATERALIZED" | "DEGRADED" | string;
  rule?: string;
  generated_at?: number; // unix seconds
  rechecked?: boolean;
  collateral_ratio?: string | number;
  surplus?: { kls: string } | null;
  errors?: string[];
  warnings?: string[];
  karlsen?: {
    total_reserve_kls?: string;
    circulating_supply_kls?: string;
    reserve_share_of_circulating_percent?: string | number;
    vault_share_of_circulating_percent?: string | number;
    vault: {
      address: string;
      type: string;
      balance_kls: string;
      utxo_count: number;
      pubkeys_script_order?: string[];
    };
    hot_wallet?: {
      address: string;
      type: string;
      purpose?: string;
      balance_kls: string;
      utxo_count: number;
      sweep_threshold_kls?: string | null;
    } | null;
  };
  solana?: {
    launched: boolean;
    cluster?: string;
    wkls_mint?: string;
    mint_authority?: string;
    freeze_authority?: string | null;
    bridge_program_id?: string;
    total_supply_wkls?: string;
    finalized_slot?: number;
    verify_url?: string;
  };
}

/** One address of a wallet's change chain (`/addresses/{a}/wallet-chain`). */
export interface ChainLink {
  address: string;
  /** < 0 earlier addresses, 0 the requested one, > 0 later ones. */
  position: number;
  via_transaction_id: string | null;
  via_block_time: number | null;
}

export interface WalletChain {
  address: string;
  addresses: ChainLink[];
  earlier_truncated: boolean;
  later_truncated: boolean;
}

export interface WalletHistoryEntry {
  transaction_id: string;
  hash: string;
  block_time: number;
  addresses: string[];
  /** Wallet address the money went to (new change address on a hop). Older APIs omit it. */
  main_address?: string | null;
  received_sompi: number;
  sent_sompi: number;
  net_sompi: number;
}

export interface WalletHistory {
  address: string;
  chain_length: number;
  total: number;
  transactions: WalletHistoryEntry[];
}
