export interface UserInfo {
  isRegistered: boolean;
  currentLevel: number;
  sponsor: string;
  referrals: number;
  balance: bigint;
  donationsReceived: number;
}

export interface ContractEvent {
  name: string;
  data: any;
  timestamp: number;
  transactionHash: string;
}
