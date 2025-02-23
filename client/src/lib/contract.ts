import { ethers } from 'ethers';
import { type UserInfo } from '@shared/types';
import { formatUnits, parseUnits } from 'viem';

const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // Será substituído após o deploy
const MUMBAI_RPC = "https://polygon-mumbai.g.alchemy.com/v2/"; // RPC mais estável

const contractABI = [
  "function users(address) view returns (bool isRegistered, uint256 currentLevel, address sponsor, uint256 referrals, uint256 balance, uint256 donationsReceived)",
  "function register(address sponsor) external",
  "function donate() external",
  "function withdraw(uint256 amount) external",
  "function levelAmounts(uint256) view returns (uint256)",
  "event UserRegistered(address indexed user, address indexed sponsor)",
  "event DonationReceived(address indexed user, uint256 amount, uint256 level)",
  "event LevelUp(address indexed user, uint256 newLevel)",
  "event Withdrawal(address indexed user, uint256 amount)"
];

export class ContractService {
  private _contract: ethers.Contract | null = null;
  private _provider: ethers.BrowserProvider | null = null;
  private _signer: ethers.Signer | null = null;

  get contract() {
    return this._contract;
  }

  async connect(provider: any) {
    this._provider = new ethers.BrowserProvider(provider);
    this._signer = await this._provider.getSigner();
    this._contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, this._signer);
  }

  async getUserInfo(address: string): Promise<UserInfo> {
    if (!this._contract) throw new Error("Contract not initialized");
    const user = await this._contract.users(address);
    return {
      isRegistered: user[0],
      currentLevel: Number(user[1]),
      sponsor: user[2],
      referrals: Number(user[3]),
      balance: user[4],
      donationsReceived: Number(user[5])
    };
  }

  async getAllUsers(): Promise<UserInfo[]> {
    if (!this._contract) throw new Error("Contract not initialized");

    // Busca todos os eventos UserRegistered desde o início do contrato
    const filter = this._contract.filters.UserRegistered();
    const events = await this._contract.queryFilter(filter);

    // Busca as informações atualizadas de cada usuário
    const users = await Promise.all(
      events.map(async (event: any) => {
        if (!event.args) return null;
        const userAddress = event.args[0];
        return await this.getUserInfo(userAddress);
      })
    );

    return users.filter((user): user is UserInfo => user !== null);
  }

  async register(sponsorAddress: string) {
    if (!this._contract) throw new Error("Contract not initialized");
    const tx = await this._contract.register(sponsorAddress);
    return await tx.wait();
  }

  async donate() {
    if (!this._contract) throw new Error("Contract not initialized");
    const tx = await this._contract.donate();
    return await tx.wait();
  }

  async withdraw(amount: bigint) {
    if (!this._contract) throw new Error("Contract not initialized");
    const tx = await this._contract.withdraw(amount);
    return await tx.wait();
  }

  async getLevelAmount(level: number): Promise<bigint> {
    if (!this._contract) throw new Error("Contract not initialized");
    return await this._contract.levelAmounts(level);
  }

  formatAmount(amount: bigint): string {
    return formatUnits(amount, 18);
  }

  parseAmount(amount: string): bigint {
    return BigInt(parseUnits(amount, 18));
  }
}

export const contractService = new ContractService();