import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PapelVinculo, Vinculo } from '@prisma/client';
import { CurrentVinculo } from '../common/decorators/current-vinculo.decorator';
import { DefinirRemuneracaoDto } from './dto/definir-remuneracao.dto';
import { DefinirResponsavelDto } from './dto/definir-responsavel.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { EmpresaRoleGuard } from '../common/guards/empresa-role.guard';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { EmpresasService } from './empresas.service';

@Controller('empresas')
@UseGuards(JwtAuthGuard)
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Post()
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateEmpresaDto) {
    return this.empresasService.create(user.id, dto);
  }

  @Get()
  findMinhas(@CurrentUser() user: CurrentUserPayload) {
    return this.empresasService.findMinhas(user.id);
  }

  @Get(':empresaId')
  @UseGuards(EmpresaRoleGuard)
  findOne(@Param('empresaId') empresaId: string) {
    return this.empresasService.findOne(empresaId);
  }

  @Patch(':empresaId')
  @UseGuards(EmpresaRoleGuard)
  @Roles(PapelVinculo.ADMIN)
  update(@Param('empresaId') empresaId: string, @Body() dto: UpdateEmpresaDto) {
    return this.empresasService.update(empresaId, dto);
  }

  @Post(':empresaId/servicos-sugeridos')
  @UseGuards(EmpresaRoleGuard)
  @Roles(PapelVinculo.ADMIN)
  adicionarServicosSugeridos(@Param('empresaId') empresaId: string) {
    return this.empresasService.adicionarServicosSugeridos(empresaId);
  }

  @Get(':empresaId/membros')
  @UseGuards(EmpresaRoleGuard)
  @Roles(PapelVinculo.ADMIN)
  listarMembros(@Param('empresaId') empresaId: string) {
    return this.empresasService.listarMembros(empresaId);
  }

  @Get(':empresaId/clientes')
  @UseGuards(EmpresaRoleGuard)
  @Roles(PapelVinculo.ADMIN, PapelVinculo.EXECUTOR)
  listarClientes(
    @Param('empresaId') empresaId: string,
    @CurrentVinculo() vinculo: Vinculo,
  ) {
    return this.empresasService.listarClientes(empresaId, vinculo);
  }

  @Patch(':empresaId/membros/:vinculoId/responsavel')
  @UseGuards(EmpresaRoleGuard)
  @Roles(PapelVinculo.ADMIN)
  definirResponsavel(
    @Param('empresaId') empresaId: string,
    @Param('vinculoId') vinculoId: string,
    @Body() dto: DefinirResponsavelDto,
  ) {
    return this.empresasService.definirResponsavel(
      empresaId,
      vinculoId,
      dto.vinculoResponsavelId ?? null,
    );
  }

  @Patch(':empresaId/membros/:vinculoId/remuneracao')
  @UseGuards(EmpresaRoleGuard)
  @Roles(PapelVinculo.ADMIN)
  definirRemuneracao(
    @Param('empresaId') empresaId: string,
    @Param('vinculoId') vinculoId: string,
    @Body() dto: DefinirRemuneracaoDto,
  ) {
    return this.empresasService.definirRemuneracao(empresaId, vinculoId, dto);
  }

  @Delete(':empresaId/membros/:vinculoId')
  @UseGuards(EmpresaRoleGuard)
  @Roles(PapelVinculo.ADMIN)
  desativarMembro(
    @Param('empresaId') empresaId: string,
    @Param('vinculoId') vinculoId: string,
  ) {
    return this.empresasService.desativarMembro(empresaId, vinculoId);
  }
}
