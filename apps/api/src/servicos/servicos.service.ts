import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PapelVinculo, StatusVinculo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdicionarExecutorDto } from './dto/adicionar-executor.dto';
import { CreateCampoRelatorioDto } from './dto/create-campo-relatorio.dto';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateCampoRelatorioDto } from './dto/update-campo-relatorio.dto';
import { UpdateServicoDto } from './dto/update-servico.dto';

const INCLUDE_EXECUTORES = {
  executores: {
    include: {
      vinculoExecutor: {
        include: { user: { select: { id: true, nome: true, email: true } } },
      },
    },
  },
  camposRelatorio: { orderBy: { ordem: 'asc' as const } },
};

function mapServico<T extends { executores: any[] }>(servico: T) {
  const { executores, ...resto } = servico;
  return {
    ...resto,
    executores: executores.map((e) => ({
      vinculoExecutorId: e.vinculoExecutor.id,
      nome: e.vinculoExecutor.user.nome,
      email: e.vinculoExecutor.user.email,
    })),
  };
}

@Injectable()
export class ServicosService {
  constructor(private readonly prisma: PrismaService) {}

  create(empresaId: string, dto: CreateServicoDto) {
    return this.prisma.servico.create({
      data: {
        empresaId,
        nome: dto.nome,
        descricao: dto.descricao,
        valor: dto.valor,
        fotos: dto.fotos ?? [],
      },
    });
  }

  async findAllDaEmpresa(empresaId: string, apenasAtivos: boolean) {
    const servicos = await this.prisma.servico.findMany({
      where: { empresaId, ...(apenasAtivos ? { ativo: true } : {}) },
      include: INCLUDE_EXECUTORES,
      orderBy: { criadoEm: 'desc' },
    });
    return servicos.map(mapServico);
  }

  async findOne(empresaId: string, servicoId: string) {
    await this.buscarDaEmpresa(empresaId, servicoId);
    const servico = await this.prisma.servico.findUnique({
      where: { id: servicoId },
      include: INCLUDE_EXECUTORES,
    });
    return mapServico(servico!);
  }

  async update(empresaId: string, servicoId: string, dto: UpdateServicoDto) {
    await this.buscarDaEmpresa(empresaId, servicoId);
    return this.prisma.servico.update({
      where: { id: servicoId },
      data: dto,
    });
  }

  async desativar(empresaId: string, servicoId: string) {
    await this.buscarDaEmpresa(empresaId, servicoId);
    return this.prisma.servico.update({
      where: { id: servicoId },
      data: { ativo: false },
    });
  }

  async listarExecutores(empresaId: string, servicoId: string) {
    await this.buscarDaEmpresa(empresaId, servicoId);
    const registros = await this.prisma.executorServico.findMany({
      where: { servicoId },
      include: { vinculoExecutor: { include: { user: true } } },
    });

    return registros.map((r) => ({
      vinculoExecutorId: r.vinculoExecutorId,
      nome: r.vinculoExecutor.user.nome,
      email: r.vinculoExecutor.user.email,
    }));
  }

  async adicionarExecutor(
    empresaId: string,
    servicoId: string,
    dto: AdicionarExecutorDto,
  ) {
    await this.buscarDaEmpresa(empresaId, servicoId);

    const vinculo = await this.prisma.vinculo.findUnique({
      where: { id: dto.vinculoExecutorId },
    });
    if (
      !vinculo ||
      vinculo.empresaId !== empresaId ||
      vinculo.papel !== PapelVinculo.EXECUTOR ||
      vinculo.status !== StatusVinculo.ATIVO
    ) {
      throw new BadRequestException(
        'Esse vínculo não é um executor ativo dessa empresa',
      );
    }

    const existente = await this.prisma.executorServico.findUnique({
      where: {
        vinculoExecutorId_servicoId: {
          vinculoExecutorId: dto.vinculoExecutorId,
          servicoId,
        },
      },
    });
    if (existente) {
      throw new ConflictException('Esse executor já realiza esse serviço');
    }

    return this.prisma.executorServico.create({
      data: { servicoId, vinculoExecutorId: dto.vinculoExecutorId },
    });
  }

  async removerExecutor(
    empresaId: string,
    servicoId: string,
    vinculoExecutorId: string,
  ) {
    await this.buscarDaEmpresa(empresaId, servicoId);
    await this.prisma.executorServico.delete({
      where: {
        vinculoExecutorId_servicoId: { vinculoExecutorId, servicoId },
      },
    });
  }

  async criarCampoRelatorio(
    empresaId: string,
    servicoId: string,
    dto: CreateCampoRelatorioDto,
  ) {
    await this.buscarDaEmpresa(empresaId, servicoId);
    return this.prisma.campoRelatorio.create({
      data: {
        servicoId,
        rotulo: dto.rotulo,
        tipo: dto.tipo,
        obrigatorio: dto.obrigatorio ?? false,
        ordem: dto.ordem ?? 0,
      },
    });
  }

  async atualizarCampoRelatorio(
    empresaId: string,
    servicoId: string,
    campoId: string,
    dto: UpdateCampoRelatorioDto,
  ) {
    await this.buscarCampoDaEmpresa(empresaId, servicoId, campoId);
    return this.prisma.campoRelatorio.update({
      where: { id: campoId },
      data: dto,
    });
  }

  async removerCampoRelatorio(
    empresaId: string,
    servicoId: string,
    campoId: string,
  ) {
    await this.buscarCampoDaEmpresa(empresaId, servicoId, campoId);
    await this.prisma.campoRelatorio.delete({ where: { id: campoId } });
  }

  private async buscarCampoDaEmpresa(
    empresaId: string,
    servicoId: string,
    campoId: string,
  ) {
    await this.buscarDaEmpresa(empresaId, servicoId);
    const campo = await this.prisma.campoRelatorio.findUnique({
      where: { id: campoId },
    });
    if (!campo || campo.servicoId !== servicoId) {
      throw new NotFoundException('Campo não encontrado');
    }
    return campo;
  }

  private async buscarDaEmpresa(empresaId: string, servicoId: string) {
    const servico = await this.prisma.servico.findUnique({
      where: { id: servicoId },
    });
    if (!servico || servico.empresaId !== empresaId) {
      throw new NotFoundException('Serviço não encontrado');
    }
    return servico;
  }
}
