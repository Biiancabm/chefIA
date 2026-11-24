import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { PASTA_UPLOADS } from './uploads/uploads.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // A logo da empresa vai no corpo da requisição como imagem em base64 (já reduzida no navegador)
  app.useBodyParser('json', { limit: '1mb' });
  // O site chama a API pelo mesmo endereço (o Vite repassa /api). CORS só libera os endereços do
  // site listados em FRONTEND_URL (separados por vírgula), não qualquer origem.
  const origens = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origens });
  // Atrás do Vite (ou de outro proxy na mesma máquina), o IP real vem no X-Forwarded-For.
  // Sem isso, o limite de tentativas contaria todo mundo como um só endereço.
  app.set('trust proxy', 'loopback');
  // Fotos enviadas (pets e relatórios). O nome do arquivo é aleatório e impossível de adivinhar.
  app.useStaticAssets(PASTA_UPLOADS, { prefix: '/uploads/' });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
