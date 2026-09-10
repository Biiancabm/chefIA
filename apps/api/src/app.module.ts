import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConvitesModule } from './convites/convites.module';
import { EmpresasModule } from './empresas/empresas.module';
import { OrdensServicoModule } from './ordens-servico/ordens-servico.module';
import { PrismaModule } from './prisma/prisma.module';
import { ServicosModule } from './servicos/servicos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    EmpresasModule,
    ConvitesModule,
    ServicosModule,
    OrdensServicoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
