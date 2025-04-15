import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Transaction } from './entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 3306),
        username: configService.get<string>('DATABASE_USER', 'root'),
        password: configService.get<string>('DATABASE_PASSWORD', ''),
        database: configService.get<string>('DATABASE_NAME', 'integrazap'),
        entities: [User, Transaction],
        synchronize: true, // Apenas para desenvolvimento; desative em produção
}),
    }),
    TypeOrmModule.forFeature([User, Transaction]), // Fornece UserRepository e TransactionRepository
  ],
  exports: [TypeOrmModule], // Exporta o TypeOrmModule para que outros módulos possam usar os repositórios
})
export class DatabaseModule {}
