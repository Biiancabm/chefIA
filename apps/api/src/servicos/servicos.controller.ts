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
import { PapelVinculo, Vinculo } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentVinculo } from '../common/decorators/current-vinculo.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { EmpresaRoleGuard } from '../common/guards/empresa-role.guard';
import { AdicionarExecutorDto } from './dto/adicionar-executor.dto';
import { CreateCampoRelatorioDto } from './dto/create-campo-relatorio.dto';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateCampoRelatorioDto } from './dto/update-campo-relatorio.dto';
import { ProporPrecoDto, ResponderPrecoDto } from './dto/preco-executor.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';
import { ServicosService } from './servicos.service';

@Controller('empresas/:empresaId/servicos')
@UseGuards(JwtAuthGuard, EmpresaRoleGuard)
export class ServicosController {
  constructor(private readonly servicosService: ServicosService) {}

  // Passeador também cria: o serviço fica aguardando a aprovação do administrador
  @Post()
  @Roles(PapelVinculo.ADMIN, PapelVinculo.EXECUTOR)
  create(
    @Param('empresaId') empresaId: string,
    @CurrentVinculo() vinculo: Vinculo,
    @Body() dto: CreateServicoDto,
  ) {
    return this.servicosService.create(empresaId, vinculo, dto);
  }

  @Get()
  findAll(
    @Param('empresaId') empresaId: string,
    @CurrentVinculo() vinculo: Vinculo,
    @Query('incluirInativos') incluirInativos?: string,
  ) {
    return this.servicosService.findAllDaEmpresa(
      empresaId,
      incluirInativos !== 'true',
      vinculo,
    );
  }

  @Patch(':servicoId/aprovacao')
  @Roles(PapelVinculo.ADMIN)
  responderServico(
    @Param('empresaId') empresaId: string,
    @Param('servicoId') servicoId: string,
    @Body() dto: ResponderPrecoDto,
  ) {
    return this.servicosService.responderServico(empresaId, servicoId, dto.aprovar);
  }

  @Delete(':servicoId/pedido')
  @Roles(PapelVinculo.EXECUTOR)
  desistirDoPedido(
    @Param('empresaId') empresaId: string,
    @Param('servicoId') servicoId: string,
    @CurrentVinculo() vinculo: Vinculo,
  ) {
    return this.servicosService.desistirDoPedido(empresaId, servicoId, vinculo.id);
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

  // Passeador pede um novo preço para si nesse serviço
  @Post(':servicoId/meu-preco')
  @Roles(PapelVinculo.EXECUTOR)
  proporPreco(
    @Param('empresaId') empresaId: string,
    @Param('servicoId') servicoId: string,
    @CurrentVinculo() vinculo: Vinculo,
    @Body() dto: ProporPrecoDto,
  ) {
    return this.servicosService.proporPreco(empresaId, servicoId, vinculo.id, dto);
  }

  @Delete(':servicoId/meu-preco')
  @Roles(PapelVinculo.EXECUTOR)
  cancelarProposta(
    @Param('empresaId') empresaId: string,
    @Param('servicoId') servicoId: string,
    @CurrentVinculo() vinculo: Vinculo,
  ) {
    return this.servicosService.cancelarProposta(empresaId, servicoId, vinculo.id);
  }

  // Administrador aprova ou recusa o preço pedido pelo passeador
  @Patch(':servicoId/executores/:vinculoExecutorId/preco')
  @Roles(PapelVinculo.ADMIN)
  responderPreco(
    @Param('empresaId') empresaId: string,
    @Param('servicoId') servicoId: string,
    @Param('vinculoExecutorId') vinculoExecutorId: string,
    @Body() dto: ResponderPrecoDto,
  ) {
    return this.servicosService.responderPreco(empresaId, servicoId, vinculoExecutorId, dto);
  }

  @Delete(':servicoId/executores/:vinculoExecutorId/preco')
  @Roles(PapelVinculo.ADMIN)
  usarPrecoDoCatalogo(
    @Param('empresaId') empresaId: string,
    @Param('servicoId') servicoId: string,
    @Param('vinculoExecutorId') vinculoExecutorId: string,
  ) {
    return this.servicosService.usarPrecoDoCatalogo(empresaId, servicoId, vinculoExecutorId);
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
