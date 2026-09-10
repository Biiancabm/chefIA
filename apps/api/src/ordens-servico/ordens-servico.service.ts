import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PapelVinculo, StatusOS, StatusVinculo, Vinculo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrdemServicoDto } from './dto/create-ordem-servico.dto';
import { CreateRelatorioDto } from './dto/create-relatorio.dto';
import { UpdateStatusOrdemServicoDto } from './dto/update-status-ordem-servico.dto';

const USER_SEGURO = {
  select: { id: true, nome: true, email: true, telefone: true },
};

const INCLUDE_PADRAO = {
  vinculoCliente: { include: { user: USER_SEGURO } },
  itens: {
    include: {
      servico: { include: { camposRelatorio: { orderBy: { ordem: 'asc' as const } } } },
      vinculoExecutor: { include: { user: USER_SEGURO } },
      relatorio: { include: { valores: true } },
    },
  },
};

@Injectable()
export class OrdensServicoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    empresaId: string,
    criadoPorId: string,
    dto: CreateOrdemServicoDto,
  ) {
    const vinculoCliente = await this.prisma.vinculo.findUnique({
      where: { id: dto.vinculoClienteId },
    });
    if (
      !vinculoCliente ||
      vinculoCliente.empresaId !== empresaId ||
      vinculoCliente.papel !== PapelVinculo.CLIENTE ||
      vinculoCliente.status !== StatusVinculo.ATIVO
    ) {
      throw new BadRequestException('Cliente inválido para essa empresa');
    }

    if (new Date(dto.dataAgendada) < new Date()) {
      throw new BadRequestException('A data agendada não pode estar no passado');
    }

    const itensPreparados = await Promise.all(
      dto.itens.map((item) => this.prepararItem(empresaId, item)),
    );

    const valorTotal = itensPreparados.reduce(
      (total, item) => total + item.valor,
      0,
    );

    return this.prisma.ordemServico.create({
      data: {
        empresaId,
        vinculoClienteId: dto.vinculoClienteId,
        dataAgendada: new Date(dto.dataAgendada),
        observacoes: dto.observacoes,
        valorTotal,
        criadoPorId,
        itens: {
          create: itensPreparados.map((item) => ({
            servicoId: item.servicoId,
            vinculoExecutorId: item.vinculoExecutorId,
            valor: item.valor,
          })),
        },
      },
      include: INCLUDE_PADRAO,
    });
  }

  async findAllDaEmpresa(empresaId: string, vinculo: Vinculo) {
    const where = this.buildWhereVisibilidade(empresaId, vinculo);
    return this.prisma.ordemServico.findMany({
      where,
      include: INCLUDE_PADRAO,
      orderBy: { dataAgendada: 'desc' },
    });
  }

  async findOne(empresaId: string, ordemServicoId: string, vinculo: Vinculo) {
    const ordemServico = await this.prisma.ordemServico.findUnique({
      where: { id: ordemServicoId },
      include: INCLUDE_PADRAO,
    });

    if (!ordemServico || ordemServico.empresaId !== empresaId) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    this.garantirVisibilidade(ordemServico, vinculo);
    return ordemServico;
  }

  async updateStatus(
    empresaId: string,
    ordemServicoId: string,
    vinculo: Vinculo,
    dto: UpdateStatusOrdemServicoDto,
  ) {
    const ordemServico = await this.prisma.ordemServico.findUnique({
      where: { id: ordemServicoId },
      include: INCLUDE_PADRAO,
    });
    if (!ordemServico || ordemServico.empresaId !== empresaId) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    this.garantirTransicaoPermitida(ordemServico, vinculo, dto.status);

    return this.prisma.ordemServico.update({
      where: { id: ordemServicoId },
      data: { status: dto.status },
      include: INCLUDE_PADRAO,
    });
  }

  async criarRelatorio(
    empresaId: string,
    ordemServicoId: string,
    itemId: string,
    vinculo: Vinculo,
    dto: CreateRelatorioDto,
  ) {
    const ordemServico = await this.prisma.ordemServico.findUnique({
      where: { id: ordemServicoId },
      include: INCLUDE_PADRAO,
    });
    if (!ordemServico || ordemServico.empresaId !== empresaId) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    const item = ordemServico.itens.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Item da ordem de serviço não encontrado');
    }

    if (
      vinculo.papel !== PapelVinculo.ADMIN &&
      item.vinculoExecutorId !== vinculo.id
    ) {
      throw new ForbiddenException(
        'Só o executor designado pode preencher esse relatório',
      );
    }

    if (ordemServico.status !== StatusOS.EXECUTANDO) {
      throw new BadRequestException(
        'A ordem de serviço precisa estar em execução para registrar o relatório',
      );
    }

    if (new Date(dto.horaFim) <= new Date(dto.horaInicio)) {
      throw new BadRequestException('O horário de fim precisa ser depois do início');
    }

    if (item.relatorio) {
      throw new BadRequestException('Esse item já tem um relatório registrado');
    }

    const camposDoServico = item.servico.camposRelatorio;
    const valoresPorCampo = new Map((dto.valores ?? []).map((v) => [v.campoId, v.valor]));

    for (const campo of camposDoServico) {
      if (campo.obrigatorio && !valoresPorCampo.get(campo.id)?.trim()) {
        throw new BadRequestException(`O campo "${campo.rotulo}" é obrigatório`);
      }
    }

    const idsCamposValidos = new Set(camposDoServico.map((c) => c.id));
    for (const campoId of valoresPorCampo.keys()) {
      if (!idsCamposValidos.has(campoId)) {
        throw new BadRequestException('Campo de relatório inválido para esse serviço');
      }
    }

    await this.prisma.relatorio.create({
      data: {
        ordemServicoItemId: itemId,
        horaInicio: new Date(dto.horaInicio),
        horaFim: new Date(dto.horaFim),
        observacoes: dto.observacoes,
        fotos: dto.fotos ?? [],
        valores: {
          create: Array.from(valoresPorCampo.entries()).map(([campoId, valor]) => ({
            campoId,
            valor,
          })),
        },
      },
    });

    const itensAtualizados = await this.prisma.ordemServicoItem.findMany({
      where: { ordemServicoId },
      include: { relatorio: true },
    });
    const todosFinalizados = itensAtualizados.every((i) => i.relatorio);

    if (todosFinalizados) {
      await this.prisma.ordemServico.update({
        where: { id: ordemServicoId },
        data: { status: StatusOS.FINALIZADO },
      });
    }

    return this.prisma.ordemServico.findUnique({
      where: { id: ordemServicoId },
      include: INCLUDE_PADRAO,
    });
  }

  private async prepararItem(
    empresaId: string,
    item: { servicoId: string; vinculoExecutorId: string },
  ) {
    const servico = await this.prisma.servico.findUnique({
      where: { id: item.servicoId },
    });
    if (!servico || servico.empresaId !== empresaId || !servico.ativo) {
      throw new BadRequestException(
        `Serviço ${item.servicoId} inválido para essa empresa`,
      );
    }

    const vinculoExecutor = await this.prisma.vinculo.findUnique({
      where: { id: item.vinculoExecutorId },
    });
    if (
      !vinculoExecutor ||
      vinculoExecutor.empresaId !== empresaId ||
      vinculoExecutor.papel !== PapelVinculo.EXECUTOR ||
      vinculoExecutor.status !== StatusVinculo.ATIVO
    ) {
      throw new BadRequestException(
        `Executor ${item.vinculoExecutorId} inválido para essa empresa`,
      );
    }

    const associacao = await this.prisma.executorServico.findUnique({
      where: {
        vinculoExecutorId_servicoId: {
          vinculoExecutorId: item.vinculoExecutorId,
          servicoId: item.servicoId,
        },
      },
    });
    if (!associacao) {
      throw new BadRequestException(
        `Esse executor não está habilitado para o serviço ${servico.nome}`,
      );
    }

    return {
      servicoId: item.servicoId,
      vinculoExecutorId: item.vinculoExecutorId,
      valor: Number(servico.valor),
    };
  }

  private buildWhereVisibilidade(empresaId: string, vinculo: Vinculo) {
    if (vinculo.papel === PapelVinculo.ADMIN) {
      return { empresaId };
    }
    if (vinculo.papel === PapelVinculo.CLIENTE) {
      return { empresaId, vinculoClienteId: vinculo.id };
    }
    return {
      empresaId,
      itens: { some: { vinculoExecutorId: vinculo.id } },
    };
  }

  private garantirVisibilidade(
    ordemServico: { vinculoClienteId: string; itens: { vinculoExecutorId: string }[] },
    vinculo: Vinculo,
  ) {
    if (vinculo.papel === PapelVinculo.ADMIN) return;
    if (
      vinculo.papel === PapelVinculo.CLIENTE &&
      ordemServico.vinculoClienteId === vinculo.id
    ) {
      return;
    }
    if (
      vinculo.papel === PapelVinculo.EXECUTOR &&
      ordemServico.itens.some((item) => item.vinculoExecutorId === vinculo.id)
    ) {
      return;
    }
    throw new ForbiddenException('Você não tem acesso a essa ordem de serviço');
  }

  private garantirTransicaoPermitida(
    ordemServico: {
      status: StatusOS;
      vinculoClienteId: string;
      itens: { vinculoExecutorId: string }[];
    },
    vinculo: Vinculo,
    novoStatus: StatusOS,
  ) {
    if (vinculo.papel === PapelVinculo.ADMIN) return;

    if (vinculo.papel === PapelVinculo.CLIENTE) {
      const donoDaOs = ordemServico.vinculoClienteId === vinculo.id;
      const transicaoValida =
        ordemServico.status === StatusOS.FINALIZADO &&
        novoStatus === StatusOS.RECEBIDO;
      if (donoDaOs && transicaoValida) return;
      throw new ForbiddenException(
        'Como cliente, você só pode confirmar o recebimento de uma OS finalizada',
      );
    }

    if (vinculo.papel === PapelVinculo.EXECUTOR) {
      const designado = ordemServico.itens.some(
        (item) => item.vinculoExecutorId === vinculo.id,
      );
      const statusPermitido: StatusOS[] = [StatusOS.EXECUTANDO, StatusOS.CANCELADO];
      const podeDefinir = statusPermitido.includes(novoStatus);
      if (designado && podeDefinir) return;
      throw new ForbiddenException(
        'Você não tem permissão para definir esse status',
      );
    }

    throw new ForbiddenException('Você não tem permissão para essa ação');
  }
}
