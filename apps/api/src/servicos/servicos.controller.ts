import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PapelVinculo } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { EmpresaRoleGuard } from '../common/guards/empresa-role.guard';
import { AdicionarExecutorDto } from './dto/adicionar-executor.dto';
import { CreateCampoRelatorioDto } from './dto/create-campo-relatorio.dto';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateCampoRelatorioDto } from './dto/update-campo-relatorio.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';
import { ServicosService } from './servicos.service';

@Controller('empresas/:empresaId/servicos')
@UseGuards(JwtAuthGuard, EmpresaRoleGuard)
export class ServicosController {
  constructor(private readonly servicosService: ServicosService) {}

  @Post()
  @Roles(PapelVinculo.ADMIN)
  create(@Param('empresaId') empresaId: string, @Body() dto: CreateServicoDto) {
    return this.servicosService.create(empresaId, dto);
  }

  @Get()
  findAll(
    @Param('empresaId') empresaId: string,
    @Query('incluirInativos') incluirInativos?: string,
  ) {
    return this.servicosService.findAllDaEmpresa(
      empresaId,
      incluirInativos !== 'true',
    );
  }

  @Get(':servicoId')
  findOne(
    @Param('empresaId') empresaId: string,
    @Param('servicoId') servicoId: string,
  ) {
    return this.servicosService.findOne(empresaId, servicoId);
  }

  @Patch(':servicoId')
  @Roles(PapelVinculo.ADMIN)
  update(
    @Param('empresaId') empresaId: string,
    @Param('servicoId') servicoId: string,
    @Body() dto: UpdateServicoDto,
  ) {
    return this.servicosService.update(empresaId, servicoId, dto);
  }

  @Delete(':servicoId')
  @Roles(PapelVinculo.ADMIN)
  desativar(
    @Param('empresaId') empresaId: string,
    @Param('servicoId') servicoId: string,
  ) {
    return this.servicosService.desativar(empresaId, servicoId);
  }

  @Get(':servicoId/executores')
  listarExecutores(
    @Param('empresaId') empresaId: string,
    @Param('servicoId') servicoId: string,
  ) {
    return this.servicosService.listarExecutores(empresaId, servicoId);
  }

  @Post(':servicoId/executores')
  @Roles(PapelVinculo.ADMIN)
  adicionarExecutor(
    @Param('empresaId') empresaId: string,
    @Param('servicoId') servicoId: string,
    @Body() dto: AdicionarExecutorDto,
  ) {
    return this.servicosService.adicionarExecutor(empresaId, servicoId, dto);
  }

  @Delete(':servicoId/executores/:vinculoExecutorId')
  @Roles(PapelVinculo.ADMIN)
  removerExecutor(
    @Param('empresaId') empresaId: string,
    @Param('servicoId') servicoId: string,
    @Param('vinculoExecutorId') vinculoExecutorId: string,
  ) {
    return this.servicosService.removerExecutor(
      empresaId,
      servicoId,
      vinculoExecutorId,
    );
  }

  @Post(':servicoId/campos-relatorio')
  @Roles(PapelVinculo.ADMIN)
  criarCampoRelatorio(
    @Param('empresaId') empresaId: string,
    @Param('servicoId') servicoId: string,
    @Body() dto: CreateCampoRelatorioDto,
  ) {
    return this.servicosService.criarCampoRelatorio(empresaId, servicoId, dto);
  }

  @Patch(':servicoId/campos-relatorio/:campoId')
  @Roles(PapelVinculo.ADMIN)
  atualizarCampoRelatorio(
    @Param('empresaId') empresaId: string,
    @Param('servicoId') servicoId: string,
    @Param('campoId') campoId: string,
    @Body() dto: UpdateCampoRelatorioDto,
  ) {
    return this.servicosService.atualizarCampoRelatorio(empresaId, servicoId, campoId, dto);
  }

  @Delete(':servicoId/campos-relatorio/:campoId')
  @Roles(PapelVinculo.ADMIN)
  removerCampoRelatorio(
    @Param('empresaId') empresaId: string,
    @Param('servicoId') servicoId: string,
    @Param('campoId') campoId: string,
  ) {
    return this.servicosService.removerCampoRelatorio(empresaId, servicoId, campoId);
  }
}
