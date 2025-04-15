import { Controller, Get, Post, Query, Headers, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { BlockchainService } from './blockchain/blockchain.service';
import { isAddress } from 'ethers';
import { Logger } from '@nestjs/common';

@Controller('api')
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly blockchainService: BlockchainService,
  ) {}

  @Get('user-info')
  async getUserInfo(@Query('address') address: string, @Headers('x-requester') requester: string) {
    this.logger.log(`Recebendo requisição para user-info com address: ${address}, requester: ${requester}`);
    
    const userAddress = address || requester;
    
    if (!userAddress || !isAddress(userAddress)) {
      this.logger.error('Endereço inválido fornecido');
      throw new HttpException('Invalid address', HttpStatus.BAD_REQUEST);
    }

    try {
      const userInfo = await this.blockchainService.getUserInfo(userAddress);
      this.logger.log(`Informações do usuário obtidas com sucesso: ${JSON.stringify(userInfo)}`);
      return userInfo;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro ao buscar informações do usuário: ${errorMessage}`);
      throw new HttpException(
        `Failed to fetch user info: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('users')
  async getUsers() {
    try {
      return await this.appService.getUsers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Failed to fetch users: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('help-price')
  async getHelpPrice() {
    return { price: await this.blockchainService.getHelpPrice() };
  }

  @Get('owner')
  async getOwner() {
    return { owner: await this.blockchainService.getOwner() };
  }

  @Get('transactions')
  async getTransactions(@Query('address') address: string) {
    if (!address || !isAddress(address)) {
      throw new HttpException('Invalid address', HttpStatus.BAD_REQUEST);
    }
    return this.blockchainService.getTransactions(address);
  }

  @Get('user-donations')
  async getUserDonations(@Query('address') address: string) {
    if (!address || !isAddress(address)) {
      throw new HttpException('Invalid address', HttpStatus.BAD_REQUEST);
    }
    return this.blockchainService.getUserDonations(address);
  }

  @Get('contract-stats')
  async getContractStats(@Headers('x-requester') requesterHeader: string, @Query('requester') requesterQuery: string) {
    this.logger.log(`Recebendo requisição para contract-stats com requester (header): ${requesterHeader}, requester (query): ${requesterQuery}`);
    
    const requester = requesterHeader || requesterQuery;
    
    if (!requester || !isAddress(requester)) {
      this.logger.error('Endereço do requester inválido');
      throw new HttpException('Invalid requester address', HttpStatus.BAD_REQUEST);
    }
    
    try {
      const stats = await this.blockchainService.getContractStats(requester);
      this.logger.log(`Estatísticas do contrato obtidas com sucesso: ${JSON.stringify(stats)}`);
      return stats;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro ao buscar estatísticas do contrato: ${errorMessage}`);
      throw new HttpException(
        `Failed to fetch contract stats: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('inject-funds')
  async injectFunds(@Body() body: { amount: string }, @Headers('x-requester') requester: string) {
    if (!body.amount || isNaN(Number(body.amount))) {
      throw new HttpException('Invalid amount', HttpStatus.BAD_REQUEST);
    }
    if (!requester || !isAddress(requester)) {
      throw new HttpException('Invalid requester address', HttpStatus.BAD_REQUEST);
    }
    return this.blockchainService.injectFunds(body.amount, requester);
  }

  @Post('inject-help')
  async injectHelp(@Body() body: { amount: string }, @Headers('x-requester') requester: string) {
    if (!body.amount || isNaN(Number(body.amount))) {
      throw new HttpException('Invalid amount', HttpStatus.BAD_REQUEST);
    }
    if (!requester || !isAddress(requester)) {
      throw new HttpException('Invalid requester address', HttpStatus.BAD_REQUEST);
    }
    return this.blockchainService.injectHelp(body.amount, requester);
  }

  @Post('reset-queue')
  async resetQueue(@Headers('x-requester') requester: string) {
    if (!requester || !isAddress(requester)) {
      throw new HttpException('Invalid requester address', HttpStatus.BAD_REQUEST);
    }
    return this.blockchainService.resetQueue(requester);
  }

  @Post('withdraw-from-reserve')
  async withdrawFromReserve(
    @Body() body: { to: string; amount: string },
    @Headers('x-requester') requester: string,
  ) {
    if (!body.to || !isAddress(body.to)) {
      throw new HttpException('Invalid to address', HttpStatus.BAD_REQUEST);
    }
    if (!body.amount || isNaN(Number(body.amount))) {
      throw new HttpException('Invalid amount', HttpStatus.BAD_REQUEST);
    }
    if (!requester || !isAddress(requester)) {
      throw new HttpException('Invalid requester address', HttpStatus.BAD_REQUEST);
    }
    return this.blockchainService.withdrawFromReserve(body.to, body.amount, requester);
  }

  @Post('recover-tokens')
  async recoverTokens(
    @Body() body: { tokenAddress: string; amount: string },
    @Headers('x-requester') requester: string,
  ) {
    if (!body.tokenAddress || !isAddress(body.tokenAddress)) {
      throw new HttpException('Invalid token address', HttpStatus.BAD_REQUEST);
    }
    if (!body.amount || isNaN(Number(body.amount))) {
      throw new HttpException('Invalid amount', HttpStatus.BAD_REQUEST);
    }
    if (!requester || !isAddress(requester)) {
      throw new HttpException('Invalid requester address', HttpStatus.BAD_REQUEST);
    }
    return this.blockchainService.recoverTokens(body.tokenAddress, body.amount, requester);
  }

  @Get('all-contract-transactions')
  async getAllContractTransactions() {
    return this.blockchainService.getAllContractTransactions();
  }

  @Get('help-transactions')
  async getHelpTransactions(@Query('address') address: string) {
    if (!address || !isAddress(address)) {
      throw new HttpException('Invalid address', HttpStatus.BAD_REQUEST);
    }
    return this.blockchainService.getHelpTransactions(address);
  }

  @Get('voluntary-donations')
  async getVoluntaryDonations(@Query('address') address: string) {
    if (!address || !isAddress(address)) {
      throw new HttpException('Invalid address', HttpStatus.BAD_REQUEST);
    }
    return this.blockchainService.getVoluntaryDonations(address);
  }

  @Post('sync')
  async syncManually(@Headers('x-requester') requester: string) {
    if (!requester || !isAddress(requester)) {
      throw new HttpException('Invalid requester address', HttpStatus.BAD_REQUEST);
    }
    return this.blockchainService.syncManually(requester);
  }
}