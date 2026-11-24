import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PapelVinculo, Prisma, StatusVinculo, Vinculo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdicionarExecutorDto } from './dto/adicionar-executor.dto';
import { CreateCampoRelatorioDto } from './dto/create-campo-relatorio.dto';
import { CreateServicoDto } from './dto/create-servico.dto';
import { UpdateCampoRelatorioDto } from './dto/update-campo-relatorio.dto';
import { ProporPrecoDto, ResponderPrecoDto } from './dto/preco-executor.dto';
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
  criadoPorVinculo: { include: { user: { select: { nome: true } } } },
};

function mapServico<T extends { executores: any[]; criadoPorVinculo?: any }>(servico: T) {
  const { executores, criadoPorVinculo, ...resto } = servico;
  return {
    ...resto,
    // Passeador que criou o serviço (vazio = criado pelo administrador)
    criadoPor: criadoPorVinculo
      ? { vinculoId: criadoPorVinculo.id, nome: criadoPorVinculo.user.nome }
      : null,
    executores: executores.map((e) => ({
      vinculoExecutorId: e.vinculoExecutor.id,
      nome: e.vinculoExecutor.user.nome,
      email: e.vinculoExecutor.user.email,
      valor: e.valor,
      valorProposto: e.valorProposto,
      propostoEm: e.propostoEm,
    })),
  };
}

@Injectable()
export class ServicosService {
  constructor(private readonly prisma: PrismaService) {}

  // Admin cria serviço que já vale. Passeador cria um pedido de serviço: ele já fica
  // habilitado nele, mas só dá para agendar depois que o administrador aprovar.
  create(empresaId: string, vinculo: Vinculo, dto: CreateServicoDto) {
    const doPasseador = vinculo.papel === PapelVinculo.EXECUTOR;
    return this.prisma.servico.create({
      data: {
        empresaId,
        nome: dto.nome,
        descricao: dto.descricao,
        valor: dto.valor,
        fotos: dto.fotos ?? [],
        aprovado: !doPasseador,
        criadoPorVinculoId: doPasseador ? vinculo.id : null,
        ...(doPasseador ? { executores: { create: { vinculoExecutorId: vinculo.id } } } : {}),
      },
    });
  }

  // Admin vê tudo (com incluirInativos). Os outros veem os serviços ativos e aprovados;
  // o passeador vê também os que ele mesmo pediu e ainda aguardam aprovação.
  async findAllDaEmpresa(empresaId: string, apenasAtivos: boolean, vinculo: Vinculo) {
    const filtro: Prisma.ServicoWhereInput =
      vinculo.papel === PapelVinculo.ADMIN
        ? apenasAtivos
          ? { ativo: true }
          : {}
        : {
            ativo: true,
            OR: [
              { aprovado: true },
              ...(vinculo.papel === PapelVinculo.EXECUTOR ? [{ criadoPorVinculoId: vinculo.id }] : []),
            ],
          };
    const servicos = await this.prisma.servico.findMany({
      where: { empresaId, ...filtro },
      include: INCLUDE_EXECUTORES,
      orderBy: { criadoEm: 'desc' },
    });
    return servicos.map(mapServico);
  }

  // Admin aprova o serviço pedido pelo passeador, ou recusa (o pedido é apagado)
  async responderServico(empresaId: string, servicoId: string, aprovar: boolean) {
    const servico = await this.buscarDaEmpresa(empresaId, servicoId);
    if (servico.aprovado) {
      throw new BadRequestException('Esse serviço já está aprovado');
    }
    if (aprovar) {
      await this.prisma.servico.update({ where: { id: servicoId }, data: { aprovado: true } });
      return this.findOne(empresaId, servicoId);
    }
    await this.apagarPedido(servicoId);
  }

  // Passeador desiste do serviço que pediu, enquanto ainda não foi aprovado
  async desistirDoPedido(empresaId: string, servicoId: string, vinculoId: string) {
    const servico = await this.buscarDaEmpresa(empresaId, servicoId);
    if (servico.aprovado || servico.criadoPorVinculoId !== vinculoId) {
      throw new ForbiddenException('Você só pode desistir de um serviço que pediu e ainda não foi aprovado');
    }
    await this.apagarPedido(servicoId);
  }

  // Um serviço ainda não aprovado nunca foi agendado, então pode ser apagado inteiro
  private async apagarPedido(servicoId: string) {
    await this.prisma.$transaction([
      this.prisma.executorServico.deleteMany({ where: { servicoId } }),
      this.prisma.campoRelatorio.deleteMany({ where: { servicoId } }),
      this.prisma.servico.delete({ where: { id: servicoId } }),
    ]);
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

  // Passeador pede um novo preço; só passa a valer depois que o administrador aprovar
  async proporPreco(
    empresaId: string,
    servicoId: string,
    vinculoExecutorId: string,
    dto: ProporPrecoDto,
  ) {
    await this.buscarAssociacao(empresaId, servicoId, vinculoExecutorId);
    await this.prisma.executorServico.update({
      where: { vinculoExecutorId_servicoId: { vinculoExecutorId, servicoId } },
      data: { valorProposto: dto.valor, propostoEm: new Date() },
    });
    return this.findOne(empresaId, servicoId);
  }

  async cancelarProposta(empresaId: string, servicoId: string, vinculoExecutorId: string) {
    await this.buscarAssociacao(empresaId, servicoId, vinculoExecutorId);
    await this.prisma.executorServico.update({
      where: { vinculoExecutorId_servicoId: { vinculoExecutorId, servicoId } },
      data: { valorProposto: null, propostoEm: null },
    });
    return this.findOne(empresaId, servicoId);
  }

  async responderPreco(
    empresaId: string,
    servicoId: string,
    vinculoExecutorId: string,
    dto: ResponderPrecoDto,
  ) {
    const associacao = await this.buscarAssociacao(empresaId, servicoId, vinculoExecutorId);
    if (associacao.valorProposto === null) {
      throw new BadRequestException('Não há preço aguardando aprovação');
    }
    await this.prisma.executorServico.update({
      where: { id: associacao.id },
      data: {
        ...(dto.aprovar ? { valor: associacao.valorProposto } : {}),
        valorProposto: null,
        propostoEm: null,
      },
    });
    return this.findOne(empresaId, servicoId);
  }

  // Volta o passeador ao preço do catálogo
  async usarPrecoDoCatalogo(empresaId: string, servicoId: string, vinculoExecutorId: string) {
    const associacao = await this.buscarAssociacao(empresaId, servicoId, vinculoExecutorId);
    await this.prisma.executorServico.update({
      where: { id: associacao.id },
      data: { valor: null },
    });
    return this.findOne(empresaId, servicoId);
  }

  private async buscarAssociacao(
    empresaId: string,
    servicoId: string,
    vinculoExecutorId: string,
  ) {
    await this.buscarDaEmpresa(empresaId, servicoId);
    const associacao = await this.prisma.executorServico.findUnique({
      where: { vinculoExecutorId_servicoId: { vinculoExecutorId, servicoId } },
    });
    if (!associacao) {
      throw new NotFoundException('Esse passeador não faz esse serviço');
    }
    return associacao;
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
