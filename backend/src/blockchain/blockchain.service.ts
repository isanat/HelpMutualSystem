import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { Contract, Wallet, EventLog, formatUnits, parseUnits, ZeroAddress, isAddress, Log } from 'ethers';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import contractABI from '../abi/contractABI.json';
import { User } from '../database/entities/user.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { RpcProviderManager } from './rpc-provider.manager';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private provider!: RpcProviderManager;
  private contract!: Contract;
  private wallet!: Wallet;
  private usdtContract!: Contract;
  private helpContract!: Contract;
  private totalUsers: number = 0;
  private totalDonations: number = 0;
  private totalVoluntaryDonations: number = 0; // Novo campo para rastrear doações voluntárias
  private totalIncentives: number = 0;
  private contractAddress!: string;
  private ownerPrivateKey!: string;
  private readonly contractDeploymentBlock = 7989112;
  private lastSyncedBlock: number = 0;
  private isSyncing: boolean = false;
  private readonly MAX_BLOCK_RANGE = 500;

  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Transaction) private transactionRepository: Repository<Transaction>,
    private rpcProviderManager: RpcProviderManager,
  ) {
    this.initialize();
  }

  private async initialize() {
    try {
      this.logger.log(`CONTRACT_ADDRESS: ${this.configService.get<string>('CONTRACT_ADDRESS')}`);
      this.logger.log(`OWNER_PRIVATE_KEY: ${this.configService.get<string>('OWNER_PRIVATE_KEY')}`);

      this.provider = this.rpcProviderManager;
      const ethersProvider = await this.provider.getProvider();
      await this.checkNetwork();

      this.contractAddress = this.configService.get<string>('CONTRACT_ADDRESS')!;
      if (!this.contractAddress || !isAddress(this.contractAddress)) {
        throw new InternalServerErrorException('Invalid or missing contract address in configuration');
      }

      this.ownerPrivateKey = this.configService.get<string>('OWNER_PRIVATE_KEY')!;
      if (!this.ownerPrivateKey) {
        throw new InternalServerErrorException('Owner private key not found in configuration');
      }

      this.wallet = new Wallet(this.ownerPrivateKey, ethersProvider);
      const walletAddress = await this.wallet.getAddress();
      this.logger.log(`Wallet address: ${walletAddress}`);

      const erc20Abi = [
        'function balanceOf(address account) view returns (uint256)',
        'function allowance(address owner, address spender) view returns (uint256)',
        'function approve(address spender, uint256 amount) returns (bool)',
        'function decimals() view returns (uint8)',
        'event Transfer(address indexed from, address indexed to, uint256 value)',
      ];

      this.contract = new Contract(this.contractAddress, contractABI, this.wallet);
      this.logger.log(`Contract initialized at address: ${this.contract.target}`);
      if (!this.contract.target) {
        throw new InternalServerErrorException('Contract target is null after initialization');
      }

      const usdtAddress = await this.contract.usdt();
      const helpAddress = await this.contract.helpToken();

      if (!isAddress(usdtAddress) || !isAddress(helpAddress)) {
        throw new InternalServerErrorException('Invalid USDT or HELP token address');
      }

      this.usdtContract = new Contract(usdtAddress, erc20Abi, this.wallet);
      this.helpContract = new Contract(helpAddress, erc20Abi, this.wallet);

      await this.initializeStats();
      await this.syncUsersAndTransactions(this.contractDeploymentBlock, 'latest');

      this.startPolling();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize BlockchainService: ${errorMessage}`);
      throw new InternalServerErrorException(`Failed to initialize blockchain service: ${errorMessage}`);
    }
  }

  private async checkNetwork() {
    this.logger.log('Checking network... Ascertain if the network is on the Sepolia testnet (chain ID 11155111).');
    const provider = await this.provider.getProvider();
    const network = await provider.getNetwork();
    this.logger.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
  }

  private async initializeStats() {
    const cachedTotalUsers = await this.cacheManager.get<number>('totalUsers');
    const cachedTotalDonations = await this.cacheManager.get<number>('totalDonations');
    const cachedTotalVoluntaryDonations = await this.cacheManager.get<number>('totalVoluntaryDonations'); // Novo cache
    const cachedTotalIncentives = await this.cacheManager.get<number>('totalIncentives');

    if (
      cachedTotalUsers !== undefined &&
      cachedTotalUsers !== null &&
      cachedTotalDonations !== undefined &&
      cachedTotalDonations !== null &&
      cachedTotalVoluntaryDonations !== undefined &&
      cachedTotalVoluntaryDonations !== null &&
      cachedTotalIncentives !== undefined &&
      cachedTotalIncentives !== null
    ) {
      this.totalUsers = cachedTotalUsers;
      this.totalDonations = cachedTotalDonations;
      this.totalVoluntaryDonations = cachedTotalVoluntaryDonations;
      this.totalIncentives = cachedTotalIncentives;
      this.logger.log(
        `Restored stats from cache: totalUsers=${this.totalUsers}, totalDonations=${this.totalDonations}, totalVoluntaryDonations=${this.totalVoluntaryDonations}, totalIncentives=${this.totalIncentives}`,
      );
    } else {
      const provider = await this.provider.getProvider();
      const latestBlock = await provider.getBlockNumber();
      const startBlock = Math.max(this.contractDeploymentBlock, latestBlock - 100000);

      let currentFromBlock = startBlock;
      while (currentFromBlock <= latestBlock) {
        const currentToBlock = Math.min(currentFromBlock + this.MAX_BLOCK_RANGE - 1, latestBlock);
        this.logger.log(`Initializing stats from block ${currentFromBlock} to ${currentToBlock}`);

        const userRegisteredFilter = this.contract.filters.UserRegistered();
        const donationReceivedFilter = this.contract.filters.DonationReceived();
        const voluntaryDonationFilter = this.contract.filters.VoluntaryDonation(); // Novo filtro
        const incentiveGrantedFilter = this.contract.filters.IncentiveGranted();

        const [userRegisteredEvents, donationReceivedEvents, voluntaryDonationEvents, incentiveGrantedEvents] = await Promise.all([
          this.contract.queryFilter(userRegisteredFilter, currentFromBlock, currentToBlock),
          this.contract.queryFilter(donationReceivedFilter, currentFromBlock, currentToBlock),
          this.contract.queryFilter(voluntaryDonationFilter, currentFromBlock, currentToBlock),
          this.contract.queryFilter(incentiveGrantedFilter, currentFromBlock, currentToBlock),
        ]);

        this.totalUsers += userRegisteredEvents.length;
        this.totalDonations += donationReceivedEvents.reduce((total, event) => {
          if (!this.hasEvent(event)) return total;
          const amount = Number(formatUnits(event.args[1], 6));
          return total + amount;
        }, 0);
        this.totalVoluntaryDonations += voluntaryDonationEvents.reduce((total, event) => {
          if (!this.hasEvent(event)) return total;
          const amount = Number(formatUnits(event.args[1], 6));
          return total + amount;
        }, 0);
        this.totalIncentives += incentiveGrantedEvents.reduce((total, event) => {
          if (!this.hasEvent(event)) return total;
          const amount = Number(formatUnits(event.args[1], 18));
          return total + amount;
        }, 0);

        currentFromBlock = currentToBlock + 1;
      }

      await this.cacheManager.set('totalUsers', this.totalUsers, 0);
      await this.cacheManager.set('totalDonations', this.totalDonations, 0);
      await this.cacheManager.set('totalVoluntaryDonations', this.totalVoluntaryDonations, 0);
      await this.cacheManager.set('totalIncentives', this.totalIncentives, 0);
    }
  }

  private startPolling() {
    setInterval(async () => {
      if (this.isSyncing) {
        this.logger.log('Sincronização já em andamento, pulando esta iteração.');
        return;
      }

      try {
        this.isSyncing = true;
        const provider = await this.provider.getProvider();
        const latestBlock = await provider.getBlockNumber();

        if (this.lastSyncedBlock >= latestBlock) {
          this.logger.log(`Nenhum novo bloco para sincronizar (lastSyncedBlock: ${this.lastSyncedBlock}, latestBlock: ${latestBlock}).`);
          return;
        }

        if (this.lastSyncedBlock === 0) {
          this.lastSyncedBlock = this.contractDeploymentBlock;
        }

        this.logger.log(`Polling: Syncing from block ${this.lastSyncedBlock} to ${latestBlock}`);
        await this.syncUsersAndTransactions(this.lastSyncedBlock, latestBlock);
        await this.updateStats(this.lastSyncedBlock, latestBlock);
        this.lastSyncedBlock = latestBlock + 1;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Error during polling: ${errorMessage}`);
      } finally {
        this.isSyncing = false;
      }
    }, 50000);
  }

  private async updateStats(startBlock: number, endBlock: number) {
    let currentFromBlock = startBlock;
    while (currentFromBlock <= endBlock) {
      const currentToBlock = Math.min(currentFromBlock + this.MAX_BLOCK_RANGE - 1, endBlock);
      this.logger.log(`Updating stats from block ${currentFromBlock} to ${currentToBlock}`);

      const userRegisteredFilter = this.contract.filters.UserRegistered();
      const donationReceivedFilter = this.contract.filters.DonationReceived();
      const voluntaryDonationFilter = this.contract.filters.VoluntaryDonation(); // Novo filtro
      const incentiveGrantedFilter = this.contract.filters.IncentiveGranted();

      const [userRegisteredEvents, donationReceivedEvents, voluntaryDonationEvents, incentiveGrantedEvents] = await Promise.all([
        this.contract.queryFilter(userRegisteredFilter, currentFromBlock, currentToBlock),
        this.contract.queryFilter(donationReceivedFilter, currentFromBlock, currentToBlock),
        this.contract.queryFilter(voluntaryDonationFilter, currentFromBlock, currentToBlock),
        this.contract.queryFilter(incentiveGrantedFilter, currentFromBlock, currentToBlock),
      ]);

      this.totalUsers += userRegisteredEvents.length;
      this.totalDonations += donationReceivedEvents.reduce((total, event) => {
        if (!this.hasEvent(event)) return total;
        const amount = Number(formatUnits(event.args[1], 6));
        return total + amount;
      }, 0);
      this.totalVoluntaryDonations += voluntaryDonationEvents.reduce((total, event) => {
        if (!this.hasEvent(event)) return total;
        const amount = Number(formatUnits(event.args[1], 6));
        return total + amount;
      }, 0);
      this.totalIncentives += incentiveGrantedEvents.reduce((total, event) => {
        if (!this.hasEvent(event)) return total;
        const amount = Number(formatUnits(event.args[1], 18));
        return total + amount;
      }, 0);

      currentFromBlock = currentToBlock + 1;
    }

    await this.cacheManager.set('totalUsers', this.totalUsers, 0);
    await this.cacheManager.set('totalDonations', this.totalDonations, 0);
    await this.cacheManager.set('totalVoluntaryDonations', this.totalVoluntaryDonations, 0);
    await this.cacheManager.set('totalIncentives', this.totalIncentives, 0);

    this.logger.log(
      `Stats updated: totalUsers=${this.totalUsers}, totalDonations=${this.totalDonations}, totalVoluntaryDonations=${this.totalVoluntaryDonations}, totalIncentives=${this.totalIncentives}`
    );
  }

  private hasEvent(item: Log | EventLog): item is EventLog {
    return 'args' in item;
  }

  private hasLog(item: Log | EventLog): item is Log {
    return !('args' in item);
  }

  private async syncUsersAndTransactions(startBlock: number, endBlock: number | 'latest') {
    const provider = await this.provider.getProvider();
    const latestBlock = endBlock === 'latest' ? await provider.getBlockNumber() : endBlock;
    this.logger.log(`Starting syncUsersAndTransactions from block ${startBlock} to ${latestBlock}`);

    // Sincronizar eventos UserRegistered
    let currentFromBlock = startBlock;
    while (currentFromBlock <= latestBlock) {
      const currentToBlock = Math.min(currentFromBlock + this.MAX_BLOCK_RANGE - 1, latestBlock);
      this.logger.log(`Syncing UserRegistered events from block ${currentFromBlock} to ${currentToBlock}`);

      const userRegisteredFilter = this.contract.filters.UserRegistered();
      let userRegisteredEvents: (EventLog | Log)[];
      try {
        userRegisteredEvents = await this.contract.queryFilter(userRegisteredFilter, currentFromBlock, currentToBlock);
        this.logger.log(`Found ${userRegisteredEvents.length} UserRegistered events in range ${currentFromBlock} to ${currentToBlock}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to query UserRegistered events: ${errorMessage}`);
        throw new InternalServerErrorException(`Failed to query UserRegistered events: ${errorMessage}`);
      }

      for (const event of userRegisteredEvents) {
        if (!this.hasEvent(event)) {
          this.logger.warn(`Skipping non-EventLog event: ${event.transactionHash}`);
          continue;
        }

        const address = event.args[0];
        const sponsor = event.args[1];
        let block;
        try {
          block = await provider.getBlock(event.blockNumber);
          if (!block) {
            this.logger.warn(`Block ${event.blockNumber} not found for event ${event.transactionHash}`);
            continue;
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to get block ${event.blockNumber}: ${errorMessage}`);
          continue;
        }

        this.logger.log(`Processing UserRegistered event for address ${address}, sponsor ${sponsor}`);

        let user = await this.userRepository.findOne({ where: { address } });
        if (!user) {
          this.logger.log(`Creating new user for address ${address}`);
          try {
            user = this.userRepository.create({
              address,
              sponsor,
              isRegistered: true,
              registrationDate: new Date(block.timestamp * 1000),
              entryFee: Number(formatUnits(await this.contract.ENTRY_FEE(), 6)),
              currentLevel: 1,
              balance: 0,
              donationsReceived: 0,
              hasDonated: false,
              isInQueue: false,
              queuePosition: 0,
              lockedAmount: 0,
              unlockTimestamp: 0,
              helpBalance: 0,
              referrals: 0,
            });
            await this.userRepository.save(user);
            this.logger.log(`User ${address} saved successfully`);
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to save user ${address}: ${errorMessage}`);
            continue;
          }
        } else {
          this.logger.log(`User ${address} already exists, updating`);
          user.sponsor = sponsor;
          user.isRegistered = true;
          user.registrationDate = new Date(block.timestamp * 1000);
          await this.userRepository.save(user);
        }

        const transaction = this.transactionRepository.create({
          transactionHash: event.transactionHash,
          method: 'Register',
          block: event.blockNumber,
          date: new Date(block.timestamp * 1000),
          from: address,
          to: this.contract.target.toString(),
          amount: Number(formatUnits(await this.contract.ENTRY_FEE(), 6)),
          token: 'USDT',
          level: 1,
        });

        const existingTransaction = await this.transactionRepository.findOne({
          where: { transactionHash: event.transactionHash },
        });
        if (!existingTransaction) {
          try {
            await this.transactionRepository.save(transaction);
            this.logger.log(`Saved transaction: ${event.transactionHash} (Register)`);
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to save transaction ${event.transactionHash}: ${errorMessage}`);
          }
        } else {
          this.logger.log(`Transaction ${event.transactionHash} already exists, skipping`);
        }
      }

      currentFromBlock = currentToBlock + 1;
    }

    // Sincronizar eventos DonationReceived
    currentFromBlock = startBlock;
    while (currentFromBlock <= latestBlock) {
      const currentToBlock = Math.min(currentFromBlock + this.MAX_BLOCK_RANGE - 1, latestBlock);
      this.logger.log(`Syncing DonationReceived events from block ${currentFromBlock} to ${currentToBlock}`);

      const donationFilter = this.contract.filters.DonationReceived();
      let donationEvents: (EventLog | Log)[];
      try {
        donationEvents = await this.contract.queryFilter(donationFilter, currentFromBlock, currentToBlock);
        this.logger.log(`Found ${donationEvents.length} DonationReceived events in range ${currentFromBlock} to ${currentToBlock}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to query DonationReceived events: ${errorMessage}`);
        throw new InternalServerErrorException(`Failed to query DonationReceived events: ${errorMessage}`);
      }

      for (const event of donationEvents) {
        if (!this.hasEvent(event)) continue;
        const userAddress = event.args[0];
        const amount = event.args[1];
        const level = event.args[2];
        const newBalance = event.args[3];
        let block;
        try {
          block = await provider.getBlock(event.blockNumber);
          if (!block) continue;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to get block ${event.blockNumber}: ${errorMessage}`);
          continue;
        }

        let user = await this.userRepository.findOne({ where: { address: userAddress } });
        if (user) {
          user.donationsReceived = (user.donationsReceived || 0) + 1;
          user.hasDonated = true;
          user.currentLevel = Number(level);
          user.balance = Number(formatUnits(newBalance, 6));
          try {
            await this.userRepository.save(user);
            this.logger.log(`Updated user ${userAddress} after DonationReceived`);
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to update user ${userAddress}: ${errorMessage}`);
          }
        }

        const transaction = this.transactionRepository.create({
          transactionHash: event.transactionHash,
          method: 'DonationReceived',
          block: event.blockNumber,
          date: new Date(block.timestamp * 1000),
          from: userAddress,
          to: this.contract.target.toString(),
          amount: Number(formatUnits(amount, 6)),
          token: 'USDT',
          level: Number(level),
        });
        const existingTransaction = await this.transactionRepository.findOne({
          where: { transactionHash: event.transactionHash },
        });
        if (!existingTransaction) {
          await this.transactionRepository.save(transaction);
          this.logger.log(`Saved transaction: ${event.transactionHash} (DonationReceived)`);
        }
      }

      currentFromBlock = currentToBlock + 1;
    }

    // Sincronizar eventos VoluntaryDonation
    currentFromBlock = startBlock;
    while (currentFromBlock <= latestBlock) {
      const currentToBlock = Math.min(currentFromBlock + this.MAX_BLOCK_RANGE - 1, latestBlock);
      this.logger.log(`Syncing VoluntaryDonation events from block ${currentFromBlock} to ${currentToBlock}`);

      const voluntaryDonationFilter = this.contract.filters.VoluntaryDonation();
      let voluntaryDonationEvents: (EventLog | Log)[];
      try {
        voluntaryDonationEvents = await this.contract.queryFilter(voluntaryDonationFilter, currentFromBlock, currentToBlock);
        this.logger.log(`Found ${voluntaryDonationEvents.length} VoluntaryDonation events in range ${currentFromBlock} to ${currentToBlock}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to query VoluntaryDonation events: ${errorMessage}`);
        throw new InternalServerErrorException(`Failed to query VoluntaryDonation events: ${errorMessage}`);
      }

      for (const event of voluntaryDonationEvents) {
        if (!this.hasEvent(event)) continue;
        const userAddress = event.args[0];
        const amount = event.args[1];
        const reservePool = event.args[2];
        let block;
        try {
          block = await provider.getBlock(event.blockNumber);
          if (!block) continue;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to get block ${event.blockNumber}: ${errorMessage}`);
          continue;
        }

        let user = await this.userRepository.findOne({ where: { address: userAddress } });
        if (user) {
          // Atualizar informações do usuário, se necessário
          await this.userRepository.save(user);
          this.logger.log(`Processed VoluntaryDonation for user ${userAddress}`);
        }

        const transaction = this.transactionRepository.create({
          transactionHash: event.transactionHash,
          method: 'VoluntaryDonation',
          block: event.blockNumber,
          date: new Date(block.timestamp * 1000),
          from: userAddress,
          to: this.contract.target.toString(),
          amount: Number(formatUnits(amount, 6)),
          token: 'USDT',
          level: user?.currentLevel || 0,
          reservePool: Number(formatUnits(reservePool, 6)), // Novo campo para armazenar o reservePool
        });
        const existingTransaction = await this.transactionRepository.findOne({
          where: { transactionHash: event.transactionHash },
        });
        if (!existingTransaction) {
          await this.transactionRepository.save(transaction);
          this.logger.log(`Saved transaction: ${event.transactionHash} (VoluntaryDonation)`);
        }
      }

      currentFromBlock = currentToBlock + 1;
    }

    // Sincronizar eventos Withdrawal
    currentFromBlock = startBlock;
    while (currentFromBlock <= latestBlock) {
      const currentToBlock = Math.min(currentFromBlock + this.MAX_BLOCK_RANGE - 1, latestBlock);
      this.logger.log(`Syncing Withdrawal events from block ${currentFromBlock} to ${currentToBlock}`);

      const withdrawalFilter = this.contract.filters.Withdrawal();
      const withdrawalEvents = await this.contract.queryFilter(withdrawalFilter, currentFromBlock, currentToBlock);

      for (const event of withdrawalEvents) {
        if (!this.hasEvent(event)) continue;
        const userAddress = event.args[0];
        const amountUsdt = event.args[1];
        const amountHelp = event.args[2];
        const remainingBalance = event.args[3];
        let block;
        try {
          block = await provider.getBlock(event.blockNumber);
          if (!block) continue;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to get block ${event.blockNumber}: ${errorMessage}`);
          continue;
        }

        let user = await this.userRepository.findOne({ where: { address: userAddress } });
        if (user) {
          user.balance = Number(formatUnits(remainingBalance, 6));
          user.helpBalance = await this.getHelpBalance(userAddress);
          await this.userRepository.save(user);
          this.logger.log(`Updated user ${userAddress} after Withdrawal`);
        }

        const transaction = this.transactionRepository.create({
          transactionHash: event.transactionHash,
          method: 'Withdrawal',
          block: event.blockNumber,
          date: new Date(block.timestamp * 1000),
          from: this.contract.target.toString(),
          to: userAddress,
          amount: Number(formatUnits(amountUsdt, 6)),
          token: 'USDT',
          level: user?.currentLevel || 0,
        });
        const existingTransaction = await this.transactionRepository.findOne({
          where: { transactionHash: event.transactionHash },
        });
        if (!existingTransaction) {
          await this.transactionRepository.save(transaction);
          this.logger.log(`Saved transaction: ${event.transactionHash} (Withdrawal)`);
        }
      }

      currentFromBlock = currentToBlock + 1;
    }

    // Sincronizar eventos IncentiveGranted
    currentFromBlock = startBlock;
    while (currentFromBlock <= latestBlock) {
      const currentToBlock = Math.min(currentFromBlock + this.MAX_BLOCK_RANGE - 1, latestBlock);
      this.logger.log(`Syncing IncentiveGranted events from block ${currentFromBlock} to ${currentToBlock}`);

      const incentiveGrantedFilter = this.contract.filters.IncentiveGranted();
      const incentiveGrantedEvents = await this.contract.queryFilter(incentiveGrantedFilter, currentFromBlock, currentToBlock);

      for (const event of incentiveGrantedEvents) {
        if (!this.hasEvent(event)) continue;
        const userAddress = event.args[0];
        const amount = event.args[1];
        const unlockTimestamp = event.args[2];
        let block;
        try {
          block = await provider.getBlock(event.blockNumber);
          if (!block) continue;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to get block ${event.blockNumber}: ${errorMessage}`);
          continue;
        }

        let user = await this.userRepository.findOne({ where: { address: userAddress } });
        if (user) {
          user.lockedAmount = Number(formatUnits(amount, 18));
          user.unlockTimestamp = Number(unlockTimestamp);
          await this.userRepository.save(user);
          this.logger.log(`Updated user ${userAddress} after IncentiveGranted`);
        }

        const transaction = this.transactionRepository.create({
          transactionHash: event.transactionHash,
          method: 'IncentiveGranted',
          block: event.blockNumber,
          date: new Date(block.timestamp * 1000),
          from: this.contract.target.toString(),
          to: userAddress,
          amount: Number(formatUnits(amount, 18)),
          token: 'HELP',
          level: user?.currentLevel || 0,
        });
        const existingTransaction = await this.transactionRepository.findOne({
          where: { transactionHash: event.transactionHash },
        });
        if (!existingTransaction) {
          await this.transactionRepository.save(transaction);
          this.logger.log(`Saved transaction: ${event.transactionHash} (IncentiveGranted)`);
        }
      }

      currentFromBlock = currentToBlock + 1;
    }

    // Sincronizar eventos IncentiveClaimed
    currentFromBlock = startBlock;
    while (currentFromBlock <= latestBlock) {
      const currentToBlock = Math.min(currentFromBlock + this.MAX_BLOCK_RANGE - 1, latestBlock);
      this.logger.log(`Syncing IncentiveClaimed events from block ${currentFromBlock} to ${currentToBlock}`);

      const incentiveClaimedFilter = this.contract.filters.IncentiveClaimed();
      const incentiveClaimedEvents = await this.contract.queryFilter(incentiveClaimedFilter, currentFromBlock, currentToBlock);

      for (const event of incentiveClaimedEvents) {
        if (!this.hasEvent(event)) continue;
        const userAddress = event.args[0];
        const amount = event.args[1];
        let block;
        try {
          block = await provider.getBlock(event.blockNumber);
          if (!block) continue;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to get block ${event.blockNumber}: ${errorMessage}`);
          continue;
        }

        let user = await this.userRepository.findOne({ where: { address: userAddress } });
        if (user) {
          user.lockedAmount = 0;
          user.unlockTimestamp = 0;
          user.helpBalance = await this.getHelpBalance(userAddress);
          await this.userRepository.save(user);
          this.logger.log(`Updated user ${userAddress} after IncentiveClaimed`);
        }

        const transaction = this.transactionRepository.create({
          transactionHash: event.transactionHash,
          method: 'IncentiveClaimed',
          block: event.blockNumber,
          date: new Date(block.timestamp * 1000),
          from: this.contract.target.toString(),
          to: userAddress,
          amount: Number(formatUnits(amount, 18)),
          token: 'HELP',
          level: user?.currentLevel || 0,
        });
        const existingTransaction = await this.transactionRepository.findOne({
          where: { transactionHash: event.transactionHash },
        });
        if (!existingTransaction) {
          await this.transactionRepository.save(transaction);
          this.logger.log(`Saved transaction: ${event.transactionHash} (IncentiveClaimed)`);
        }
      }

      currentFromBlock = currentToBlock + 1;
    }

    // Sincronizar eventos LevelUp
    currentFromBlock = startBlock;
    while (currentFromBlock <= latestBlock) {
      const currentToBlock = Math.min(currentFromBlock + this.MAX_BLOCK_RANGE - 1, latestBlock);
      this.logger.log(`Syncing LevelUp events from block ${currentFromBlock} to ${currentToBlock}`);

      const levelUpFilter = this.contract.filters.LevelUp();
      const levelUpEvents = await this.contract.queryFilter(levelUpFilter, currentFromBlock, currentToBlock);

      for (const event of levelUpEvents) {
        if (!this.hasEvent(event)) continue;
        const userAddress = event.args[0];
        const newLevel = event.args[1];
        const remainingBalance = event.args[2];
        let block;
        try {
          block = await provider.getBlock(event.blockNumber);
          if (!block) continue;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to get block ${event.blockNumber}: ${errorMessage}`);
          continue;
        }

        let user = await this.userRepository.findOne({ where: { address: userAddress } });
        if (user) {
          user.currentLevel = Number(newLevel);
          user.balance = Number(formatUnits(remainingBalance, 6));
          await this.userRepository.save(user);
          this.logger.log(`Updated user ${userAddress} after LevelUp to level ${newLevel}`);
        }

        const transaction = this.transactionRepository.create({
          transactionHash: event.transactionHash,
          method: 'LevelUp',
          block: event.blockNumber,
          date: new Date(block.timestamp * 1000),
          from: userAddress,
          to: this.contract.target.toString(),
          amount: 0,
          token: 'N/A',
          level: Number(newLevel),
        });
        const existingTransaction = await this.transactionRepository.findOne({
          where: { transactionHash: event.transactionHash },
        });
        if (!existingTransaction) {
          await this.transactionRepository.save(transaction);
          this.logger.log(`Saved transaction: ${event.transactionHash} (LevelUp)`);
        }
      }

      currentFromBlock = currentToBlock + 1;
    }
  }

  async getContractStats(requester: string) {
    if (!isAddress(requester)) {
      throw new InternalServerErrorException('Invalid requester address');
    }

    if (requester.toLowerCase() !== this.wallet.address.toLowerCase()) {
      throw new InternalServerErrorException('Only the owner can view contract stats');
    }

    const provider = await this.provider.getProvider();
    const contractBalanceUsdt = Number(formatUnits(await this.usdtContract.balanceOf(this.contract.target), 6));
    const contractBalanceHelp = Number(formatUnits(await this.helpContract.balanceOf(this.contract.target), 18));

    return {
      totalUsers: this.totalUsers,
      totalDonations: this.totalDonations,
      totalVoluntaryDonations: this.totalVoluntaryDonations, // Novo campo
      totalIncentives: this.totalIncentives,
      contractBalanceUsdt,
      contractBalanceHelp,
    };
  }

  async getAllContractTransactions() {
    const transactions = await this.transactionRepository.find({
      order: { date: 'DESC' },
    });

    return transactions.map((tx: Transaction) => ({
      transactionHash: tx.transactionHash,
      method: tx.method,
      block: tx.block,
      date: tx.date.toISOString(),
      from: tx.from,
      to: tx.to,
      amount: tx.amount,
      token: tx.token,
      level: tx.level,
      reservePool: tx.reservePool, // Novo campo
    }));
  }

  async getAllUsers() {
    return this.userRepository.find({
      select: ['address'],
    });
  }

  async getUserInfo(address: string) {
    if (!isAddress(address)) {
      throw new InternalServerErrorException('Invalid address');
    }

    let user = await this.userRepository.findOne({ where: { address } });
    if (!user) {
      user = this.userRepository.create({
        address,
        isRegistered: false,
        sponsor: ZeroAddress,
        entryFee: Number(formatUnits(await this.contract.ENTRY_FEE(), 6)),
        currentLevel: 0,
        balance: 0,
        donationsReceived: 0,
        hasDonated: false,
        isInQueue: false,
        queuePosition: 0,
        lockedAmount: 0,
        unlockTimestamp: 0,
        helpBalance: 0,
        referrals: 0,
      });
      await this.userRepository.save(user);
    }

    const queueInfo = await this.getUserQueueAndIncentiveInfo(address);
    user.isInQueue = queueInfo.isInQueue;
    user.queuePosition = queueInfo.queuePosition;
    user.lockedAmount = queueInfo.lockedAmount;
    user.unlockTimestamp = queueInfo.unlockTimestamp;
    user.helpBalance = await this.getHelpBalance(address);

    const allUsers = await this.userRepository.find();
    const userIndex = allUsers.findIndex((u: User) => u.address.toLowerCase() === address.toLowerCase());
    user.queuePosition = user.isInQueue ? userIndex + 1 : 0;

    const referralEvents = allUsers.filter((u: User) => u.sponsor.toLowerCase() === address.toLowerCase());
    user.referrals = referralEvents.length;

    await this.userRepository.save(user);

    return {
      isRegistered: user.isRegistered,
      currentLevel: user.currentLevel,
      sponsor: user.sponsor,
      referrals: user.referrals,
      balance: user.balance,
      donationsReceived: user.donationsReceived,
      hasDonated: user.hasDonated,
      queuePosition: user.queuePosition,
      registrationDate: user.registrationDate ? user.registrationDate.toISOString() : '',
      entryFee: user.entryFee,
      helpBalance: user.helpBalance,
      isInQueue: user.isInQueue,
      lockedAmount: user.lockedAmount,
      unlockTimestamp: user.unlockTimestamp,
    };
  }

  async getUserQueueAndIncentiveInfo(address: string) {
    if (!isAddress(address)) {
      throw new InternalServerErrorException('Invalid address');
    }

    const info = await this.contract.getUserQueueAndIncentiveInfo(address);
    return {
      isInQueue: info.isInQueue,
      queuePosition: Number(info.queuePosition),
      lockedAmount: Number(formatUnits(info.lockedAmount, 18)),
      unlockTimestamp: Number(info.unlockTimestamp),
    };
  }

  async getHelpPrice(): Promise<number> {
    const price = await this.contract.getHelpPrice();
    return Number(formatUnits(price, 8));
  }

  async getHelpBalance(address: string): Promise<number> {
    if (!isAddress(address)) {
      throw new InternalServerErrorException('Invalid address');
    }

    try {
      const balance = await this.helpContract.balanceOf(address);
      return Number(formatUnits(balance, 18));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get HELP balance for ${address}: ${errorMessage}`);
      return 0;
    }
  }

  async getOwner(): Promise<string> {
    return this.wallet.address;
  }

  async getTransactions(address: string): Promise<any[]> {
    if (!isAddress(address)) {
      throw new InternalServerErrorException('Invalid address');
    }

    const transactions = await this.transactionRepository.find({
      where: [
        { from: address },
        { to: address },
      ],
      order: { date: 'DESC' },
    });

    return transactions.map((tx: Transaction) => ({
      transactionHash: tx.transactionHash,
      method: tx.method,
      block: tx.block,
      date: tx.date.toISOString(),
      from: tx.from,
      to: tx.to,
      amount: tx.amount,
      token: tx.token,
      level: tx.level,
      reservePool: tx.reservePool, // Novo campo
    }));
  }

  async getHelpTransactions(address: string) {
    if (!isAddress(address)) {
      throw new InternalServerErrorException('Invalid user address');
    }

    const transactions = await this.transactionRepository.find({
      where: [
        { from: address, token: 'HELP' },
        { to: address, token: 'HELP' },
      ],
      order: { date: 'DESC' },
    });

    return transactions.map((tx: Transaction) => ({
      transactionHash: tx.transactionHash,
      method: tx.method,
      block: tx.block,
      date: tx.date.toISOString(),
      from: tx.from,
      to: tx.to,
      amount: tx.amount,
      token: tx.token,
      level: tx.level,
    }));
  }

  async getUserDonations(address: string) {
    if (!isAddress(address)) {
      throw new InternalServerErrorException('Invalid user address');
    }

    const donations = await this.transactionRepository.find({
      where: [
        { method: 'DonationReceived', from: address },
        { method: 'Donate', from: address },
      ],
      order: { date: 'DESC' },
    });

    return donations.map((donation: Transaction) => ({
      transactionHash: donation.transactionHash,
      method: donation.method,
      block: donation.block,
      date: donation.date.toISOString(),
      amount: donation.amount,
      level: donation.level || 0,
    }));
  }

  async getVoluntaryDonations(address: string) {
    if (!isAddress(address)) {
      throw new InternalServerErrorException('Invalid user address');
    }

    const donations = await this.transactionRepository.find({
      where: [
        { method: 'VoluntaryDonation', from: address },
      ],
      order: { date: 'DESC' },
    });

    return donations.map((donation: Transaction) => ({
      transactionHash: donation.transactionHash,
      method: donation.method,
      block: donation.block,
      date: donation.date.toISOString(),
      from: donation.from,
      amount: donation.amount,
      reservePool: donation.reservePool,
    }));
  }

  async injectFunds(amount: string, requester: string) {
    if (!isAddress(requester)) {
      throw new InternalServerErrorException('Invalid requester address');
    }

    if (requester.toLowerCase() !== this.wallet.address.toLowerCase()) {
      throw new InternalServerErrorException('Only the owner can inject funds');
    }

    const amountParsed = parseUnits(amount, 6);
    const allowance = await this.usdtContract.allowance(this.wallet.address, this.contract.target);
    if (allowance < amountParsed) {
      const approveTx = await this.usdtContract.approve(this.contract.target, amountParsed);
      await approveTx.wait();
    }

    const tx = await this.contract.injectFunds(amountParsed);
    const receipt = await tx.wait();
    return { transactionHash: receipt.transactionHash };
  }

  async injectHelp(amount: string, requester: string) {
    if (!isAddress(requester)) {
      throw new InternalServerErrorException('Invalid requester address');
    }

    if (requester.toLowerCase() !== this.wallet.address.toLowerCase()) {
      throw new InternalServerErrorException('Only the owner can inject HELP');
    }

    const amountParsed = parseUnits(amount, 18);
    const allowance = await this.helpContract.allowance(this.wallet.address, this.contract.target);
    if (allowance < amountParsed) {
      const approveTx = await this.helpContract.approve(this.contract.target, amountParsed);
      await approveTx.wait();
    }

    const tx = await this.contract.injectHelp(amountParsed);
    const receipt = await tx.wait();
    return { transactionHash: receipt.transactionHash };
  }

  async resetQueue(requester: string) {
    if (!isAddress(requester)) {
      throw new InternalServerErrorException('Invalid requester address');
    }

    if (requester.toLowerCase() !== this.wallet.address.toLowerCase()) {
      throw new InternalServerErrorException('Only the owner can reset the queue');
    }

    const tx = await this.contract.resetQueue();
    const receipt = await tx.wait();

    await this.userRepository.update({}, { isInQueue: false, queuePosition: 0 });

    return { transactionHash: receipt.transactionHash };
  }

  async withdrawFromReserve(to: string, amount: string, requester: string) {
    if (!isAddress(to) || !isAddress(requester)) {
      throw new InternalServerErrorException('Invalid to or requester address');
    }

    if (requester.toLowerCase() !== this.wallet.address.toLowerCase()) {
      throw new InternalServerErrorException('Only the owner can withdraw from reserve');
    }

    const amountParsed = parseUnits(amount, 6);
    const tx = await this.contract.withdrawFromReserve(to, amountParsed);
    const receipt = await tx.wait();
    return { transactionHash: receipt.transactionHash };
  }

  async recoverTokens(tokenAddress: string, amount: string, requester: string) {
    if (!isAddress(tokenAddress) || !isAddress(requester)) {
      throw new InternalServerErrorException('Invalid token or requester address');
    }

    if (requester.toLowerCase() !== this.wallet.address.toLowerCase()) {
      throw new InternalServerErrorException('Only the owner can recover tokens');
    }

    const tokenContract = new Contract(tokenAddress, [
      'function decimals() view returns (uint8)',
    ], this.wallet);
    const decimals = await tokenContract.decimals();
    const amountParsed = parseUnits(amount, decimals);

    const tx = await this.contract.recoverTokens(tokenAddress, amountParsed);
    const receipt = await tx.wait();
    return { transactionHash: receipt.transactionHash };
  }

  async updateHelpPrice(price: string, requester: string) {
    if (!isAddress(requester)) {
      throw new InternalServerErrorException('Invalid requester address');
    }

    if (requester.toLowerCase() !== this.wallet.address.toLowerCase()) {
      throw new InternalServerErrorException('Only the owner can update HELP price');
    }

    const priceParsed = parseUnits(price, 8);
    const tx = await this.contract.updateHelpPrice(priceParsed);
    const receipt = await tx.wait();
    return { transactionHash: receipt.transactionHash };
  }

  async syncManually(requester: string): Promise<{ message: string }> {
    if (!isAddress(requester)) {
      throw new InternalServerErrorException('Invalid requester address');
    }

    if (requester.toLowerCase() !== this.wallet.address.toLowerCase()) {
      throw new InternalServerErrorException('Only the owner can trigger manual sync');
    }

    if (this.isSyncing) {
      throw new InternalServerErrorException('Synchronization already in progress');
    }

    this.isSyncing = true;
    try {
      const provider = await this.provider.getProvider();
      const latestBlock = await provider.getBlockNumber();

      if (this.lastSyncedBlock === 0) {
        this.lastSyncedBlock = this.contractDeploymentBlock;
      }

      this.logger.log(`Manual sync: Syncing from block ${this.lastSyncedBlock} to ${latestBlock}`);
      await this.syncUsersAndTransactions(this.lastSyncedBlock, latestBlock);
      await this.updateStats(this.lastSyncedBlock, latestBlock);
      this.lastSyncedBlock = latestBlock + 1;

      return { message: `Sincronização manual concluída com sucesso. Blocos sincronizados: ${this.lastSyncedBlock}` };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error during manual sync: ${errorMessage}`);
      throw new InternalServerErrorException(`Failed to perform manual sync: ${errorMessage}`);
    } finally {
      this.isSyncing = false;
    }
  }
}