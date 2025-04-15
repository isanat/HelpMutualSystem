import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3001; // Porta 3001 por padrão
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}

bootstrap();