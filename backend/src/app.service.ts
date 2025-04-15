import { Injectable } from '@nestjs/common';
import { BlockchainService } from './blockchain/blockchain.service';

@Injectable()
export class AppService {
  constructor(private readonly blockchainService: BlockchainService) {}

  // ... outros métodos existentes ...

  async getUsers(): Promise<string[]> {
    const users = await this.blockchainService.getAllUsers();
    return users.map(user => user.address);
  }
}