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
var RpcProviderManager_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcProviderManager = void 0;
// www/wwwroot/integrazap.shop/backend/src/blockchain/rpc-provider.manager.ts
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ethers_1 = require("ethers");
let RpcProviderManager = RpcProviderManager_1 = class RpcProviderManager {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RpcProviderManager_1.name);
        this.isUsingAlternative = false;
        this.initialize();
    }
    initialize() {
        this.primaryRpcUrl = this.configService.get('RPC_URL');
        this.alternativeRpcUrl = this.configService.get('RPC_URL_ALTERNATIVE');
        if (!this.primaryRpcUrl || !this.alternativeRpcUrl) {
            throw new common_1.InternalServerErrorException('RPC URLs not found in configuration');
        }
        this.logger.log(`Initializing provider with primary RPC URL: ${this.primaryRpcUrl}`);
        this.provider = new ethers_1.JsonRpcProvider(this.primaryRpcUrl);
    }
    async getProvider() {
        try {
            await this.checkNetwork(this.provider);
            return this.provider;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Primary RPC failed: ${errorMessage}`);
            if (!this.isUsingAlternative) {
                this.logger.log(`Switching to alternative RPC URL: ${this.alternativeRpcUrl}`);
                this.provider = new ethers_1.JsonRpcProvider(this.alternativeRpcUrl);
                this.isUsingAlternative = true;
                await this.checkNetwork(this.provider);
                return this.provider;
            }
            else {
                throw new common_1.InternalServerErrorException(`Both primary and alternative RPCs failed: ${errorMessage}`);
            }
        }
    }
    async checkNetwork(provider) {
        const network = await provider.getNetwork();
        // Substituímos 11155111n por BigInt(11155111) para compatibilidade com targets < ES2020
        if (network.chainId !== BigInt(11155111)) {
            throw new common_1.InternalServerErrorException(`Invalid network: expected Sepolia (chainId 11155111), but got chainId ${network.chainId}`);
        }
        this.logger.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
    }
};
exports.RpcProviderManager = RpcProviderManager;
exports.RpcProviderManager = RpcProviderManager = RpcProviderManager_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RpcProviderManager);
