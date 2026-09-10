import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { ConvitesController } from './convites.controller';
import { ConvitesService } from './convites.service';
import { EmpresaConvitesController } from './empresa-convites.controller';

@Module({
  imports: [MailModule],
  controllers: [ConvitesController, EmpresaConvitesController],
  providers: [ConvitesService],
})
export class ConvitesModule {}
