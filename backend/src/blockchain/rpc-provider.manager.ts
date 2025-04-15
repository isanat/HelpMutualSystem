// www/wwwroot/integrazap.shop/backend/src/blockchain/rpc-provider.manager.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonRpcProvider } from 'ethers';

@Injectable()
export class RpcProviderManager {
  private readonly logger = new Logger(RpcProviderManager.name);
  private primaryRpcUrl!: string;
  private alternativeRpcUrl!: string;
  private provider!: JsonRpcProvider;
  private isUsingAlternative: boolean = false;

  constructor(private configService: ConfigService) {
    this.initialize();
  }

  private initialize() {
    this.primaryRpcUrl = this.configService.get<string>('RPC_URL')!;
    this.alternativeRpcUrl = this.configService.get<string>('RPC_URL_ALTERNATIVE')!;

    if (!this.primaryRpcUrl || !this.alternativeRpcUrl) {
      throw new InternalServerErrorException('RPC URLs not found in configuration');
    }

    this.logger.log(`Initializing provider with primary RPC URL: ${this.primaryRpcUrl}`);
    this.provider = new JsonRpcProvider(this.primaryRpcUrl);
  }

  async getProvider(): Promise<JsonRpcProvider> {
    try {
      await this.checkNetwork(this.provider);
      return this.provider;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Primary RPC failed: ${errorMessage}`);

      if (!this.isUsingAlternative) {
        this.logger.log(`Switching to alternative RPC URL: ${this.alternativeRpcUrl}`);
        this.provider = new JsonRpcProvider(this.alternativeRpcUrl);
        this.isUsingAlternative = true;
        await this.checkNetwork(this.provider);
        return this.provider;
      } else {
        throw new InternalServerErrorException(
          `Both primary and alternative RPCs failed: ${errorMessage}`,
        );
      }
    }
  }

  async checkNetwork(provider: JsonRpcProvider) {
    const network = await provider.getNetwork();
    // Substituímos 11155111n por BigInt(11155111) para compatibilidade com targets < ES2020
    if (network.chainId !== BigInt(11155111)) {
      throw new InternalServerErrorException(
        `Invalid network: expected Sepolia (chainId 11155111), but got chainId ${network.chainId}`,
      );
    }
    this.logger.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
  }
}