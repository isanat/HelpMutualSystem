// www/wwwroot/integrazap.shop/backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlockchainModule } from './blockchain/blockchain.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutos, para consistência com o BlockchainModule
    }),
    DatabaseModule, // Fornece a integração com MySQL
    BlockchainModule, // Já está importado, o que está correto
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}