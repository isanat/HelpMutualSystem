"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainModule = void 0;
// www/wwwroot/integrazap.shop/backend/src/blockchain/blockchain.module.ts
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const config_1 = require("@nestjs/config");
const blockchain_service_1 = require("./blockchain.service");
const rpc_provider_manager_1 = require("./rpc-provider.manager"); // Importando o RpcProviderManager
const database_module_1 = require("../database/database.module"); // Importando o DatabaseModule
let BlockchainModule = class BlockchainModule {
};
exports.BlockchainModule = BlockchainModule;
exports.BlockchainModule = BlockchainModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule, // Fornece UserRepository e TransactionRepository
            config_1.ConfigModule, // Fornece ConfigService
            cache_manager_1.CacheModule.register({
                ttl: 300, // 5 minutos
            }),
        ],
        providers: [blockchain_service_1.BlockchainService, rpc_provider_manager_1.RpcProviderManager], // Adicionando RpcProviderManager como provedor
        exports: [blockchain_service_1.BlockchainService],
    })
], BlockchainModule);
