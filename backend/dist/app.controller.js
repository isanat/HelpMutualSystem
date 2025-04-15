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
var AppController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const blockchain_service_1 = require("./blockchain/blockchain.service");
const ethers_1 = require("ethers");
const common_2 = require("@nestjs/common");
let AppController = AppController_1 = class AppController {
    constructor(appService, blockchainService) {
        this.appService = appService;
        this.blockchainService = blockchainService;
        this.logger = new common_2.Logger(AppController_1.name);
    }
    async getUserInfo(address, requester) {
        this.logger.log(`Recebendo requisição para user-info com address: ${address}, requester: ${requester}`);
        const userAddress = address || requester;
        if (!userAddress || !(0, ethers_1.isAddress)(userAddress)) {
            this.logger.error('Endereço inválido fornecido');
            throw new common_1.HttpException('Invalid address', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const userInfo = await this.blockchainService.getUserInfo(userAddress);
            this.logger.log(`Informações do usuário obtidas com sucesso: ${JSON.stringify(userInfo)}`);
            return userInfo;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Erro ao buscar informações do usuário: ${errorMessage}`);
            throw new common_1.HttpException(`Failed to fetch user info: ${errorMessage}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUsers() {
        try {
            return await this.appService.getUsers();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new common_1.HttpException(`Failed to fetch users: ${errorMessage}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getHelpPrice() {
        return { price: await this.blockchainService.getHelpPrice() };
    }
    async getOwner() {
        return { owner: await this.blockchainService.getOwner() };
    }
    async getTransactions(address) {
        if (!address || !(0, ethers_1.isAddress)(address)) {
            throw new common_1.HttpException('Invalid address', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.blockchainService.getTransactions(address);
    }
    async getUserDonations(address) {
        if (!address || !(0, ethers_1.isAddress)(address)) {
            throw new common_1.HttpException('Invalid address', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.blockchainService.getUserDonations(address);
    }
    async getContractStats(requesterHeader, requesterQuery) {
        this.logger.log(`Recebendo requisição para contract-stats com requester (header): ${requesterHeader}, requester (query): ${requesterQuery}`);
        const requester = requesterHeader || requesterQuery;
        if (!requester || !(0, ethers_1.isAddress)(requester)) {
            this.logger.error('Endereço do requester inválido');
            throw new common_1.HttpException('Invalid requester address', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const stats = await this.blockchainService.getContractStats(requester);
            this.logger.log(`Estatísticas do contrato obtidas com sucesso: ${JSON.stringify(stats)}`);
            return stats;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Erro ao buscar estatísticas do contrato: ${errorMessage}`);
            throw new common_1.HttpException(`Failed to fetch contract stats: ${errorMessage}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async injectFunds(body, requester) {
        if (!body.amount || isNaN(Number(body.amount))) {
            throw new common_1.HttpException('Invalid amount', common_1.HttpStatus.BAD_REQUEST);
        }
        if (!requester || !(0, ethers_1.isAddress)(requester)) {
            throw new common_1.HttpException('Invalid requester address', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.blockchainService.injectFunds(body.amount, requester);
    }
    async injectHelp(body, requester) {
        if (!body.amount || isNaN(Number(body.amount))) {
            throw new common_1.HttpException('Invalid amount', common_1.HttpStatus.BAD_REQUEST);
        }
        if (!requester || !(0, ethers_1.isAddress)(requester)) {
            throw new common_1.HttpException('Invalid requester address', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.blockchainService.injectHelp(body.amount, requester);
    }
    async resetQueue(requester) {
        if (!requester || !(0, ethers_1.isAddress)(requester)) {
            throw new common_1.HttpException('Invalid requester address', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.blockchainService.resetQueue(requester);
    }
    async withdrawFromReserve(body, requester) {
        if (!body.to || !(0, ethers_1.isAddress)(body.to)) {
            throw new common_1.HttpException('Invalid to address', common_1.HttpStatus.BAD_REQUEST);
        }
        if (!body.amount || isNaN(Number(body.amount))) {
            throw new common_1.HttpException('Invalid amount', common_1.HttpStatus.BAD_REQUEST);
        }
        if (!requester || !(0, ethers_1.isAddress)(requester)) {
            throw new common_1.HttpException('Invalid requester address', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.blockchainService.withdrawFromReserve(body.to, body.amount, requester);
    }
    async recoverTokens(body, requester) {
        if (!body.tokenAddress || !(0, ethers_1.isAddress)(body.tokenAddress)) {
            throw new common_1.HttpException('Invalid token address', common_1.HttpStatus.BAD_REQUEST);
        }
        if (!body.amount || isNaN(Number(body.amount))) {
            throw new common_1.HttpException('Invalid amount', common_1.HttpStatus.BAD_REQUEST);
        }
        if (!requester || !(0, ethers_1.isAddress)(requester)) {
            throw new common_1.HttpException('Invalid requester address', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.blockchainService.recoverTokens(body.tokenAddress, body.amount, requester);
    }
    async getAllContractTransactions() {
        return this.blockchainService.getAllContractTransactions();
    }
    async getHelpTransactions(address) {
        if (!address || !(0, ethers_1.isAddress)(address)) {
            throw new common_1.HttpException('Invalid address', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.blockchainService.getHelpTransactions(address);
    }
    async getVoluntaryDonations(address) {
        if (!address || !(0, ethers_1.isAddress)(address)) {
            throw new common_1.HttpException('Invalid address', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.blockchainService.getVoluntaryDonations(address);
    }
    async syncManually(requester) {
        if (!requester || !(0, ethers_1.isAddress)(requester)) {
            throw new common_1.HttpException('Invalid requester address', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.blockchainService.syncManually(requester);
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)('user-info'),
    __param(0, (0, common_1.Query)('address')),
    __param(1, (0, common_1.Headers)('x-requester')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getUserInfo", null);
__decorate([
    (0, common_1.Get)('users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('help-price'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getHelpPrice", null);
__decorate([
    (0, common_1.Get)('owner'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getOwner", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, common_1.Query)('address')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Get)('user-donations'),
    __param(0, (0, common_1.Query)('address')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getUserDonations", null);
__decorate([
    (0, common_1.Get)('contract-stats'),
    __param(0, (0, common_1.Headers)('x-requester')),
    __param(1, (0, common_1.Query)('requester')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getContractStats", null);
__decorate([
    (0, common_1.Post)('inject-funds'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-requester')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "injectFunds", null);
__decorate([
    (0, common_1.Post)('inject-help'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-requester')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "injectHelp", null);
__decorate([
    (0, common_1.Post)('reset-queue'),
    __param(0, (0, common_1.Headers)('x-requester')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "resetQueue", null);
__decorate([
    (0, common_1.Post)('withdraw-from-reserve'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-requester')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "withdrawFromReserve", null);
__decorate([
    (0, common_1.Post)('recover-tokens'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-requester')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "recoverTokens", null);
__decorate([
    (0, common_1.Get)('all-contract-transactions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAllContractTransactions", null);
__decorate([
    (0, common_1.Get)('help-transactions'),
    __param(0, (0, common_1.Query)('address')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getHelpTransactions", null);
__decorate([
    (0, common_1.Get)('voluntary-donations'),
    __param(0, (0, common_1.Query)('address')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getVoluntaryDonations", null);
__decorate([
    (0, common_1.Post)('sync'),
    __param(0, (0, common_1.Headers)('x-requester')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "syncManually", null);
exports.AppController = AppController = AppController_1 = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [app_service_1.AppService,
        blockchain_service_1.BlockchainService])
], AppController);
