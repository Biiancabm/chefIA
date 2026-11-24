import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssistidosModule } from './assistidos/assistidos.module';
import { AuthModule } from './auth/auth.module';
import { ConvitesModule } from './convites/convites.module';
import { EmpresasModule } from './empresas/empresas.module';
import { OrdensServicoModule } from './ordens-servico/ordens-servico.module';
import { PrismaModule } from './prisma/prisma.module';
import { ServicosModule } from './servicos/servicos.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Limite geral folgado (300 pedidos por minuto por endereço); login e cadastro têm limite próprio
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    PrismaModule,
    AuthModule,
    EmpresasModule,
    ConvitesModule,
    ServicosModule,
    OrdensServicoModule,
    AssistidosModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
