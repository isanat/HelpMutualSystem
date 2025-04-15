// www/wwwroot/integrazap.shop/backend/src/blockchain/blockchain.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { RpcProviderManager } from './rpc-provider.manager'; // Importando o RpcProviderManager
import { DatabaseModule } from '../database/database.module'; // Importando o DatabaseModule

@Module({
  imports: [
    DatabaseModule, // Fornece UserRepository e TransactionRepository
    ConfigModule, // Fornece ConfigService
    CacheModule.register({
      ttl: 300, // 5 minutos
    }),
  ],
  providers: [BlockchainService, RpcProviderManager], // Adicionando RpcProviderManager como provedor
  exports: [BlockchainService],
})
export class BlockchainModule {}