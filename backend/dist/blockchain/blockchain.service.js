"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var BlockchainService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainService = void 0;
const cache_manager_1 = require("@nestjs/cache-manager");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ethers_1 = require("ethers");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const contractABI_json_1 = __importDefault(require("../abi/contractABI.json"));
const user_entity_1 = require("../database/entities/user.entity");
const transaction_entity_1 = require("../database/entities/transaction.entity");
const rpc_provider_manager_1 = require("./rpc-provider.manager");
let BlockchainService = BlockchainService_1 = class BlockchainService {
    constructor(configService, cacheManager, userRepository, transactionRepository, rpcProviderManager) {
        this.configService = configService;
        this.cacheManager = cacheManager;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.rpcProviderManager = rpcProviderManager;
        this.logger = new common_1.Logger(BlockchainService_1.name);
        this.totalUsers = 0;
        this.totalDonations = 0;
        this.totalVoluntaryDonations = 0; // Novo campo para rastrear doações voluntárias
        this.totalIncentives = 0;
        this.contractDeploymentBlock = 7989112;
        this.lastSyncedBlock = 0;
        this.isSyncing = false;
        this.MAX_BLOCK_RANGE = 500;
        this.initialize();
    }
    async initialize() {
        try {
            this.logger.log(`CONTRACT_ADDRESS: ${this.configService.get('CONTRACT_ADDRESS')}`);
            this.logger.log(`OWNER_PRIVATE_KEY: ${this.configService.get('OWNER_PRIVATE_KEY')}`);
            this.provider = this.rpcProviderManager;
            const ethersProvider = await this.provider.getProvider();
            await this.checkNetwork();
            this.contractAddress = this.configService.get('CONTRACT_ADDRESS');
            if (!this.contractAddress || !(0, ethers_1.isAddress)(this.contractAddress)) {
                throw new common_1.InternalServerErrorException('Invalid or missing contract address in configuration');
            }
            this.ownerPrivateKey = this.configService.get('OWNER_PRIVATE_KEY');
            if (!this.ownerPrivateKey) {
                throw new common_1.InternalServerErrorException('Owner private key not found in configuration');
            }
            this.wallet = new ethers_1.Wallet(this.ownerPrivateKey, ethersProvider);
            const walletAddress = await this.wallet.getAddress();
            this.logger.log(`Wallet address: ${walletAddress}`);
            const erc20Abi = [
                'function balanceOf(address account) view returns (uint256)',
                'function allowance(address owner, address spender) view returns (uint256)',
                'function approve(address spender, uint256 amount) returns (bool)',
                'function decimals() view returns (uint8)',
                'event Transfer(address indexed from, address indexed to, uint256 value)',
            ];
            this.contract = new ethers_1.Contract(this.contractAddress, contractABI_json_1.default, this.wallet);
            this.logger.log(`Contract initialized at address: ${this.contract.target}`);
            if (!this.contract.target) {
                throw new common_1.InternalServerErrorException('Contract target is null after initialization');
            }
            const usdtAddress = await this.contract.usdt();
            const helpAddress = await this.contract.helpToken();
            if (!(0, ethers_1.isAddress)(usdtAddress) || !(0, ethers_1.isAddress)(helpAddress)) {
                throw new common_1.InternalServerErrorException('Invalid USDT or HELP token address');
            }
            this.usdtContract = new ethers_1.Contract(usdtAddress, erc20Abi, this.wallet);
            this.helpContract = new ethers_1.Contract(helpAddress, erc20Abi, this.wallet);
            await this.initializeStats();
            await this.syncUsersAndTransactions(this.contractDeploymentBlock, 'latest');
            this.startPolling();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to initialize BlockchainService: ${errorMessage}`);
            throw new common_1.InternalServerErrorException(`Failed to initialize blockchain service: ${errorMessage}`);
        }
    }
    async checkNetwork() {
        this.logger.log('Checking network... Ascertain if the network is on the Sepolia testnet (chain ID 11155111).');
        const provider = await this.provider.getProvider();
        const network = await provider.getNetwork();
        this.logger.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
    }
    async initializeStats() {
        const cachedTotalUsers = await this.cacheManager.get('totalUsers');
        const cachedTotalDonations = await this.cacheManager.get('totalDonations');
        const cachedTotalVoluntaryDonations = await this.cacheManager.get('totalVoluntaryDonations'); // Novo cache
        const cachedTotalIncentives = await this.cacheManager.get('totalIncentives');
        if (cachedTotalUsers !== undefined &&
            cachedTotalUsers !== null &&
            cachedTotalDonations !== undefined &&
            cachedTotalDonations !== null &&
            cachedTotalVoluntaryDonations !== undefined &&
            cachedTotalVoluntaryDonations !== null &&
            cachedTotalIncentives !== undefined &&
            cachedTotalIncentives !== null) {
            this.totalUsers = cachedTotalUsers;
            this.totalDonations = cachedTotalDonations;
            this.totalVoluntaryDonations = cachedTotalVoluntaryDonations;
            this.totalIncentives = cachedTotalIncentives;
            this.logger.log(`Restored stats from cache: totalUsers=${this.totalUsers}, totalDonations=${this.totalDonations}, totalVoluntaryDonations=${this.totalVoluntaryDonations}, totalIncentives=${this.totalIncentives}`);
        }
        else {
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
                    if (!this.hasEvent(event))
                        return total;
                    const amount = Number((0, ethers_1.formatUnits)(event.args[1], 6));
                    return total + amount;
                }, 0);
                this.totalVoluntaryDonations += voluntaryDonationEvents.reduce((total, event) => {
                    if (!this.hasEvent(event))
                        return total;
                    const amount = Number((0, ethers_1.formatUnits)(event.args[1], 6));
                    return total + amount;
                }, 0);
                this.totalIncentives += incentiveGrantedEvents.reduce((total, event) => {
                    if (!this.hasEvent(event))
                        return total;
                    const amount = Number((0, ethers_1.formatUnits)(event.args[1], 18));
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
    startPolling() {
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
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`Error during polling: ${errorMessage}`);
            }
            finally {
                this.isSyncing = false;
            }
        }, 50000);
    }
    async updateStats(startBlock, endBlock) {
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
                if (!this.hasEvent(event))
                    return total;
                const amount = Number((0, ethers_1.formatUnits)(event.args[1], 6));
                return total + amount;
            }, 0);
            this.totalVoluntaryDonations += voluntaryDonationEvents.reduce((total, event) => {
                if (!this.hasEvent(event))
                    return total;
                const amount = Number((0, ethers_1.formatUnits)(event.args[1], 6));
                return total + amount;
            }, 0);
            this.totalIncentives += incentiveGrantedEvents.reduce((total, event) => {
                if (!this.hasEvent(event))
                    return total;
                const amount = Number((0, ethers_1.formatUnits)(event.args[1], 18));
                return total + amount;
            }, 0);
            currentFromBlock = currentToBlock + 1;
        }
        await this.cacheManager.set('totalUsers', this.totalUsers, 0);
        await this.cacheManager.set('totalDonations', this.totalDonations, 0);
        await this.cacheManager.set('totalVoluntaryDonations', this.totalVoluntaryDonations, 0);
        await this.cacheManager.set('totalIncentives', this.totalIncentives, 0);
        this.logger.log(`Stats updated: totalUsers=${this.totalUsers}, totalDonations=${this.totalDonations}, totalVoluntaryDonations=${this.totalVoluntaryDonations}, totalIncentives=${this.totalIncentives}`);
    }
    hasEvent(item) {
        return 'args' in item;
    }
    hasLog(item) {
        return !('args' in item);
    }
    async syncUsersAndTransactions(startBlock, endBlock) {
        const provider = await this.provider.getProvider();
        const latestBlock = endBlock === 'latest' ? await provider.getBlockNumber() : endBlock;
        this.logger.log(`Starting syncUsersAndTransactions from block ${startBlock} to ${latestBlock}`);
        // Sincronizar eventos UserRegistered
        let currentFromBlock = startBlock;
        while (currentFromBlock <= latestBlock) {
            const currentToBlock = Math.min(currentFromBlock + this.MAX_BLOCK_RANGE - 1, latestBlock);
            this.logger.log(`Syncing UserRegistered events from block ${currentFromBlock} to ${currentToBlock}`);
            const userRegisteredFilter = this.contract.filters.UserRegistered();
            let userRegisteredEvents;
            try {
                userRegisteredEvents = await this.contract.queryFilter(userRegisteredFilter, currentFromBlock, currentToBlock);
                this.logger.log(`Found ${userRegisteredEvents.length} UserRegistered events in range ${currentFromBlock} to ${currentToBlock}`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`Failed to query UserRegistered events: ${errorMessage}`);
                throw new common_1.InternalServerErrorException(`Failed to query UserRegistered events: ${errorMessage}`);
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
                }
                catch (error) {
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
                            entryFee: Number((0, ethers_1.formatUnits)(await this.contract.ENTRY_FEE(), 6)),
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
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        this.logger.error(`Failed to save user ${address}: ${errorMessage}`);
                        continue;
                    }
                }
                else {
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
                    amount: Number((0, ethers_1.formatUnits)(await this.contract.ENTRY_FEE(), 6)),
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
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        this.logger.error(`Failed to save transaction ${event.transactionHash}: ${errorMessage}`);
                    }
                }
                else {
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
            let donationEvents;
            try {
                donationEvents = await this.contract.queryFilter(donationFilter, currentFromBlock, currentToBlock);
                this.logger.log(`Found ${donationEvents.length} DonationReceived events in range ${currentFromBlock} to ${currentToBlock}`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`Failed to query DonationReceived events: ${errorMessage}`);
                throw new common_1.InternalServerErrorException(`Failed to query DonationReceived events: ${errorMessage}`);
            }
            for (const event of donationEvents) {
                if (!this.hasEvent(event))
                    continue;
                const userAddress = event.args[0];
                const amount = event.args[1];
                const level = event.args[2];
                const newBalance = event.args[3];
                let block;
                try {
                    block = await provider.getBlock(event.blockNumber);
                    if (!block)
                        continue;
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.logger.error(`Failed to get block ${event.blockNumber}: ${errorMessage}`);
                    continue;
                }
                let user = await this.userRepository.findOne({ where: { address: userAddress } });
                if (user) {
                    user.donationsReceived = (user.donationsReceived || 0) + 1;
                    user.hasDonated = true;
                    user.currentLevel = Number(level);
                    user.balance = Number((0, ethers_1.formatUnits)(newBalance, 6));
                    try {
                        await this.userRepository.save(user);
                        this.logger.log(`Updated user ${userAddress} after DonationReceived`);
                    }
                    catch (error) {
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
                    amount: Number((0, ethers_1.formatUnits)(amount, 6)),
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
            let voluntaryDonationEvents;
            try {
                voluntaryDonationEvents = await this.contract.queryFilter(voluntaryDonationFilter, currentFromBlock, currentToBlock);
                this.logger.log(`Found ${voluntaryDonationEvents.length} VoluntaryDonation events in range ${currentFromBlock} to ${currentToBlock}`);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`Failed to query VoluntaryDonation events: ${errorMessage}`);
                throw new common_1.InternalServerErrorException(`Failed to query VoluntaryDonation events: ${errorMessage}`);
            }
            for (const event of voluntaryDonationEvents) {
                if (!this.hasEvent(event))
                    continue;
                const userAddress = event.args[0];
                const amount = event.args[1];
                const reservePool = event.args[2];
                let block;
                try {
                    block = await provider.getBlock(event.blockNumber);
                    if (!block)
                        continue;
                }
                catch (error) {
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
                    amount: Number((0, ethers_1.formatUnits)(amount, 6)),
                    token: 'USDT',
                    level: user?.currentLevel || 0,
                    reservePool: Number((0, ethers_1.formatUnits)(reservePool, 6)), // Novo campo para armazenar o reservePool
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
                if (!this.hasEvent(event))
                    continue;
                const userAddress = event.args[0];
                const amountUsdt = event.args[1];
                const amountHelp = event.args[2];
                const remainingBalance = event.args[3];
                let block;
                try {
                    block = await provider.getBlock(event.blockNumber);
                    if (!block)
                        continue;
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.logger.error(`Failed to get block ${event.blockNumber}: ${errorMessage}`);
                    continue;
                }
                let user = await this.userRepository.findOne({ where: { address: userAddress } });
                if (user) {
                    user.balance = Number((0, ethers_1.formatUnits)(remainingBalance, 6));
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
                    amount: Number((0, ethers_1.formatUnits)(amountUsdt, 6)),
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
                if (!this.hasEvent(event))
                    continue;
                const userAddress = event.args[0];
                const amount = event.args[1];
                const unlockTimestamp = event.args[2];
                let block;
                try {
                    block = await provider.getBlock(event.blockNumber);
                    if (!block)
                        continue;
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.logger.error(`Failed to get block ${event.blockNumber}: ${errorMessage}`);
                    continue;
                }
                let user = await this.userRepository.findOne({ where: { address: userAddress } });
                if (user) {
                    user.lockedAmount = Number((0, ethers_1.formatUnits)(amount, 18));
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
                    amount: Number((0, ethers_1.formatUnits)(amount, 18)),
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
                if (!this.hasEvent(event))
                    continue;
                const userAddress = event.args[0];
                const amount = event.args[1];
                let block;
                try {
                    block = await provider.getBlock(event.blockNumber);
                    if (!block)
                        continue;
                }
                catch (error) {
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
                    amount: Number((0, ethers_1.formatUnits)(amount, 18)),
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
                if (!this.hasEvent(event))
                    continue;
                const userAddress = event.args[0];
                const newLevel = event.args[1];
                const remainingBalance = event.args[2];
                let block;
                try {
                    block = await provider.getBlock(event.blockNumber);
                    if (!block)
                        continue;
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.logger.error(`Failed to get block ${event.blockNumber}: ${errorMessage}`);
                    continue;
                }
                let user = await this.userRepository.findOne({ where: { address: userAddress } });
                if (user) {
                    user.currentLevel = Number(newLevel);
                    user.balance = Number((0, ethers_1.formatUnits)(remainingBalance, 6));
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
    async getContractStats(requester) {
        if (!(0, ethers_1.isAddress)(requester)) {
            throw new common_1.InternalServerErrorException('Invalid requester address');
        }
        if (requester.toLowerCase() !== this.wallet.address.toLowerCase()) {
            throw new common_1.InternalServerErrorException('Only the owner can view contract stats');
        }
        const provider = await this.provider.getProvider();
        const contractBalanceUsdt = Number((0, ethers_1.formatUnits)(await this.usdtContract.balanceOf(this.contract.target), 6));
        const contractBalanceHelp = Number((0, ethers_1.formatUnits)(await this.helpContract.balanceOf(this.contract.target), 18));
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
        return transactions.map((tx) => ({
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
    async getUserInfo(address) {
        if (!(0, ethers_1.isAddress)(address)) {
            throw new common_1.InternalServerErrorException('Invalid address');
        }
        let user = await this.userRepository.findOne({ where: { address } });
        if (!user) {
            user = this.userRepository.create({
                address,
                isRegistered: false,
                sponsor: ethers_1.ZeroAddress,
                entryFee: Number((0, ethers_1.formatUnits)(await this.contract.ENTRY_FEE(), 6)),
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
        const userIndex = allUsers.findIndex((u) => u.address.toLowerCase() === address.toLowerCase());
        user.queuePosition = user.isInQueue ? userIndex + 1 : 0;
        const referralEvents = allUsers.filter((u) => u.sponsor.toLowerCase() === address.toLowerCase());
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
    async getUserQueueAndIncentiveInfo(address) {
        if (!(0, ethers_1.isAddress)(address)) {
            throw new common_1.InternalServerErrorException('Invalid address');
        }
        const info = await this.contract.getUserQueueAndIncentiveInfo(address);
        return {
            isInQueue: info.isInQueue,
            queuePosition: Number(info.queuePosition),
            lockedAmount: Number((0, ethers_1.formatUnits)(info.lockedAmount, 18)),
            unlockTimestamp: Number(info.unlockTimestamp),
        };
    }
    async getHelpPrice() {
        const price = await this.contract.getHelpPrice();
        return Number((0, ethers_1.formatUnits)(price, 8));
    }
    async getHelpBalance(address) {
        if (!(0, ethers_1.isAddress)(address)) {
            throw new common_1.InternalServerErrorException('Invalid address');
        }
        try {
            const balance = await this.helpContract.balanceOf(address);
            return Number((0, ethers_1.formatUnits)(balance, 18));
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to get HELP balance for ${address}: ${errorMessage}`);
            return 0;
        }
    }
    async getOwner() {
        return this.wallet.address;
    }
    async getTransactions(address) {
        if (!(0, ethers_1.isAddress)(address)) {
            throw new common_1.InternalServerErrorException('Invalid address');
        }
        const transactions = await this.transactionRepository.find({
            where: [
                { from: address },
                { to: address },
            ],
            order: { date: 'DESC' },
        });
        return transactions.map((tx) => ({
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
    async getHelpTransactions(address) {
        if (!(0, ethers_1.isAddress)(address)) {
            throw new common_1.InternalServerErrorException('Invalid user address');
        }
        const transactions = await this.transactionRepository.find({
            where: [
                { from: address, token: 'HELP' },
                { to: address, token: 'HELP' },
            ],
            order: { date: 'DESC' },
        });
        return transactions.map((tx) => ({
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
    async getUserDonations(address) {
        if (!(0, ethers_1.isAddress)(address)) {
            throw new common_1.InternalServerErrorException('Invalid user address');
        }
        const donations = await this.transactionRepository.find({
            where: [
                { method: 'DonationReceived', from: address },
                { method: 'Donate', from: address },
            ],
            order: { date: 'DESC' },
        });
        return donations.map((donation) => ({
            transactionHash: donation.transactionHash,
            method: donation.method,
            block: donation.block,
            date: donation.date.toISOString(),
            amount: donation.amount,
            level: donation.level || 0,
        }));
    }
    async getVoluntaryDonations(address) {
        if (!(0, ethers_1.isAddress)(address)) {
            throw new common_1.InternalServerErrorException('Invalid user address');
        }
        const donations = await this.transactionRepository.find({
            where: [
                { method: 'VoluntaryDonation', from: address },
            ],
            order: { date: 'DESC' },
        });
        return donations.map((donation) => ({
            transactionHash: donation.transactionHash,
            method: donation.method,
            block: donation.block,
            date: donation.date.toISOString(),
            from: donation.from,
            amount: donation.amount,
            reservePool: donation.reservePool,
        }));
    }
    async injectFunds(amount, requester) {
        if (!(0, ethers_1.isAddress)(requester)) {
            throw new common_1.InternalServerErrorException('Invalid requester address');
        }
        if (requester.toLowerCase() !== this.wallet.address.toLowerCase()) {
            throw new common_1.InternalServerErrorException('Only the owner can inject funds');
        }
        const amountParsed = (0, ethers_1.parseUnits)(amount, 6);
        const allowance = await this.usdtContract.allowance(this.wallet.address, this.contract.target);
        if (allowance < amountParsed) {
            const approveTx = await this.usdtContract.approve(this.contract.target, amountParsed);
            await approveTx.wait();
        }
        const tx = await this.contract.injectFunds(amountParsed);
        const receipt = await tx.wait();
        return { transactionHash: receipt.transactionHash };
    }
    async injectHelp(amount, requester) {
        if (!(0, ethers_1.isAddress)(requester)) {
            throw new common_1.InternalServerErrorException('Invalid requester address');
        }
        if (requester.toLowerCase() !== this.wallet.address.toLowerCase()) {
            throw new common_1.InternalServerErrorException('Only the owner can inject HELP');
        }
        const amountParsed = (0, ethers_1.parseUnits)(amount, 18);
        const allowance = await this.helpContract.allowance(this.wallet.address, this.contract.target);
        if (allowance < amountParsed) {
            const approveTx = await this.helpContract.approve(this.contract.target, amountParsed);
            await approveTx.wait();
        }
        const tx = await this.contract.injectHelp(amountParsed);
        const receipt = await tx.wait();
        return { transactionHash: receipt.transactionHash };
    }
    async resetQueue(requester) {
        if (!(0, ethers_1.isAddress)(requester)) {
            throw new common_1.InternalServerErrorException('Invalid requester address');
        }
        if (requester.toLowerCase() !== this.wallet.address.toLowerCase()) {
            throw new common_1.InternalServerErrorException('Only the owner can reset the queue');
        }
        const tx = await this.contract.resetQueue();
        const receipt = await tx.wait();
        await this.userRepository.update({}, { isInQueue: false, queuePosition: 0 });
        return { transactionHash: receipt.transactionHash };
    }
    async withdrawFromReserve(to, amount, requester) {
        if (!(0, ethers_1.isAddress)(to) || !(0, ethers_1.isAddress)(requester)) {
            throw new common_1.InternalServerErrorException('Invalid to or requester address');
        }
        if (requester.toLowerCase() !== this.wallet.address.toLowerCase()) {
            throw new common_1.InternalServerErrorException('Only the owner can withdraw from reserve');
        }
        const amountParsed = (0, ethers_1.parseUnits)(amount, 6);
        const tx = await this.contract.withdrawFromReserve(to, amountParsed);
        const receipt = await tx.wait();
        return { transactionHash: receipt.transactionHash };
    }
    async recoverTokens(tokenAddress, amount, requester) {
        if (!(0, ethers_1.isAddress)(tokenAddress) || !(0, ethers_1.isAddress)(requester)) {
            throw new common_1.InternalServerErrorException('Invalid token or requester address');
        }
        if (requester.toLowerCase() !== this.wallet.address.toLowerCase()) {
            throw new common_1.InternalServerErrorException('Only the owner can recover tokens');
        }
        const tokenContract = new ethers_1.Contract(tokenAddress, [
            'function decimals() view returns (uint8)',
        ], this.wallet);
        const decimals = await tokenContract.decimals();
        const amountParsed = (0, ethers_1.parseUnits)(amount, decimals);
        const tx = await this.contract.recoverTokens(tokenAddress, amountParsed);
        const receipt = await tx.wait();
        return { transactionHash: receipt.transactionHash };
    }
    async updateHelpPrice(price, requester) {
        if (!(0, ethers_1.isAddress)(requester)) {
            throw new common_1.InternalServerErrorException('Invalid requester address');
        }
        if (requester.toLowerCase() !== this.wallet.address.toLowerCase()) {
            throw new common_1.InternalServerErrorException('Only the owner can update HELP price');
        }
        const priceParsed = (0, ethers_1.parseUnits)(price, 8);
        const tx = await this.contract.updateHelpPrice(priceParsed);
        const receipt = await tx.wait();
        return { transactionHash: receipt.transactionHash };
    }
    async syncManually(requester) {
        if (!(0, ethers_1.isAddress)(requester)) {
            throw new common_1.InternalServerErrorException('Invalid requester address');
        }
        if (requester.toLowerCase() !== this.wallet.address.toLowerCase()) {
            throw new common_1.InternalServerErrorException('Only the owner can trigger manual sync');
        }
        if (this.isSyncing) {
            throw new common_1.InternalServerErrorException('Synchronization already in progress');
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error during manual sync: ${errorMessage}`);
            throw new common_1.InternalServerErrorException(`Failed to perform manual sync: ${errorMessage}`);
        }
        finally {
            this.isSyncing = false;
        }
    }
};
exports.BlockchainService = BlockchainService;
exports.BlockchainService = BlockchainService = BlockchainService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __param(2, (0, typeorm_2.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_2.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [config_1.ConfigService, Object, typeorm_1.Repository,
        typeorm_1.Repository,
        rpc_provider_manager_1.RpcProviderManager])
], BlockchainService);
