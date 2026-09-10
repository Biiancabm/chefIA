import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PapelVinculo, Vinculo } from '@prisma/client';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentVinculo } from '../common/decorators/current-vinculo.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { EmpresaRoleGuard } from '../common/guards/empresa-role.guard';
import { CreateOrdemServicoDto } from './dto/create-ordem-servico.dto';
import { CreateRelatorioDto } from './dto/create-relatorio.dto';
import { UpdateStatusOrdemServicoDto } from './dto/update-status-ordem-servico.dto';
import { OrdensServicoService } from './ordens-servico.service';

@Controller('empresas/:empresaId/ordens-servico')
@UseGuards(JwtAuthGuard, EmpresaRoleGuard)
export class OrdensServicoController {
  constructor(private readonly ordensServicoService: OrdensServicoService) {}

  @Post()
  @Roles(PapelVinculo.ADMIN, PapelVinculo.EXECUTOR)
  create(
    @Param('empresaId') empresaId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateOrdemServicoDto,
  ) {
    return this.ordensServicoService.create(empresaId, user.id, dto);
  }

  @Get()
  findAll(
    @Param('empresaId') empresaId: string,
    @CurrentVinculo() vinculo: Vinculo,
  ) {
    return this.ordensServicoService.findAllDaEmpresa(empresaId, vinculo);
  }

  @Get(':ordemServicoId')
  findOne(
    @Param('empresaId') empresaId: string,
    @Param('ordemServicoId') ordemServicoId: string,
    @CurrentVinculo() vinculo: Vinculo,
  ) {
    return this.ordensServicoService.findOne(empresaId, ordemServicoId, vinculo);
  }

  @Patch(':ordemServicoId/status')
  updateStatus(
    @Param('empresaId') empresaId: string,
    @Param('ordemServicoId') ordemServicoId: string,
    @CurrentVinculo() vinculo: Vinculo,
    @Body() dto: UpdateStatusOrdemServicoDto,
  ) {
    return this.ordensServicoService.updateStatus(
      empresaId,
      ordemServicoId,
      vinculo,
      dto,
    );
  }

  @Post(':ordemServicoId/itens/:itemId/relatorio')
  criarRelatorio(
    @Param('empresaId') empresaId: string,
    @Param('ordemServicoId') ordemServicoId: string,
    @Param('itemId') itemId: string,
    @CurrentVinculo() vinculo: Vinculo,
    @Body() dto: CreateRelatorioDto,
  ) {
    return this.ordensServicoService.criarRelatorio(
      empresaId,
      ordemServicoId,
      itemId,
      vinculo,
      dto,
    );
  }
}
