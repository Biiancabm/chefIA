import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PapelVinculo } from '@prisma/client';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { EmpresaRoleGuard } from '../common/guards/empresa-role.guard';
import { ConvitesService } from './convites.service';
import { CreateConviteDto } from './dto/create-convite.dto';

@Controller('empresas/:empresaId/convites')
@UseGuards(JwtAuthGuard, EmpresaRoleGuard)
@Roles(PapelVinculo.ADMIN)
export class EmpresaConvitesController {
  constructor(private readonly convitesService: ConvitesService) {}

  @Post()
  create(
    @Param('empresaId') empresaId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateConviteDto,
  ) {
    return this.convitesService.create(empresaId, user.id, dto);
  }

  @Get()
  findAtivos(@Param('empresaId') empresaId: string) {
    return this.convitesService.findAtivosDaEmpresa(empresaId);
  }

  @Delete(':conviteId')
  revogar(
    @Param('empresaId') empresaId: string,
    @Param('conviteId') conviteId: string,
  ) {
    return this.convitesService.revogar(empresaId, conviteId);
  }
}
