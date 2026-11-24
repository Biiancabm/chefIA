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
import { RegistrarPagamentoDto } from './dto/registrar-pagamento.dto';
import { UpdateStatusOrdemServicoDto } from './dto/update-status-ordem-servico.dto';

const USER_SEGURO = {
  select: { id: true, nome: true, email: true, telefone: true },
};

const INCLUDE_PADRAO = {
  vinculoCliente: { include: { user: USER_SEGURO } },
  assistido: true,
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
    vinculoCriador: Vinculo,
    dto: CreateOrdemServicoDto,
  ) {
    // O cliente sempre pede para si mesmo
    const vinculoClienteId =
      vinculoCriador.papel === PapelVinculo.CLIENTE ? vinculoCriador.id : dto.vinculoClienteId;
    if (!vinculoClienteId) {
      throw new BadRequestException('Escolha o cliente');
    }

    const vinculoCliente = await this.prisma.vinculo.findUnique({
      where: { id: vinculoClienteId },
    });
    if (
      !vinculoCliente ||
      vinculoCliente.empresaId !== empresaId ||
      vinculoCliente.papel !== PapelVinculo.CLIENTE ||
      vinculoCliente.status !== StatusVinculo.ATIVO
    ) {
      throw new BadRequestException('Cliente inválido para essa empresa');
    }

    // Funcionário só agenda para os próprios clientes, e sempre como quem vai executar
    if (vinculoCriador.papel === PapelVinculo.EXECUTOR) {
      if (vinculoCliente.vinculoResponsavelId !== vinculoCriador.id) {
        throw new ForbiddenException(
          'Você só pode agendar para os clientes pelos quais é responsável',
        );
      }
      if (dto.itens.some((item) => item.vinculoExecutorId !== vinculoCriador.id)) {
        throw new ForbiddenException(
          'Você só pode agendar atendimentos para você mesmo',
        );
      }
    }

    // Cliente pede ao passeador responsável por ele
    if (vinculoCriador.papel === PapelVinculo.CLIENTE) {
      if (!vinculoCliente.vinculoResponsavelId) {
        throw new BadRequestException(
          'Você ainda não tem um passeador responsável. Fale com a empresa.',
        );
      }
      if (
        dto.itens.some(
          (item) => item.vinculoExecutorId !== vinculoCliente.vinculoResponsavelId,
        )
      ) {
        throw new ForbiddenException('Você só pode pedir ao seu passeador responsável');
      }
    }

    // Quem não criou o pedido precisa aceitar: o passeador aceita o pedido do cliente,
    // o cliente aceita o que o passeador agendou. O que o admin agenda já vale.
    const statusInicial = {
      [PapelVinculo.ADMIN]: StatusOS.AGENDADO,
      [PapelVinculo.EXECUTOR]: StatusOS.PENDENTE_CLIENTE,
      [PapelVinculo.CLIENTE]: StatusOS.PENDENTE_EXECUTOR,
    }[vinculoCriador.papel];

    if (dto.assistidoId) {
      const assistido = await this.prisma.assistido.findUnique({
        where: { id: dto.assistidoId },
      });
      if (
        !assistido ||
        !assistido.ativo ||
        assistido.empresaId !== empresaId ||
        assistido.vinculoClienteId !== vinculoCliente.id
      ) {
        throw new BadRequestException('Esse cadastro não pertence a esse cliente');
      }
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
        vinculoClienteId,
        status: statusInicial,
        assistidoId: dto.assistidoId,
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

    const aceitando =
      dto.status === StatusOS.AGENDADO &&
      (ordemServico.status === StatusOS.PENDENTE_CLIENTE ||
        ordemServico.status === StatusOS.PENDENTE_EXECUTOR);
    if (aceitando && ordemServico.dataAgendada < new Date()) {
      throw new BadRequestException(
        'O horário desse pedido já passou. Recuse e combine uma nova data.',
      );
    }

    return this.prisma.ordemServico.update({
      where: { id: ordemServicoId },
      data: { status: dto.status },
      include: INCLUDE_PADRAO,
    });
  }

  async registrarPagamento(
    empresaId: string,
    ordemServicoId: string,
    dto: RegistrarPagamentoDto,
  ) {
    const ordemServico = await this.prisma.ordemServico.findUnique({
      where: { id: ordemServicoId },
    });
    if (!ordemServico || ordemServico.empresaId !== empresaId) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    if (!dto.pago) {
      return this.prisma.ordemServico.update({
        where: { id: ordemServicoId },
        data: { pagoEm: null, formaPagamento: null },
        include: INCLUDE_PADRAO,
      });
    }

    const semValor: StatusOS[] = [
      StatusOS.CANCELADO,
      StatusOS.RECUSADO,
      StatusOS.PENDENTE_CLIENTE,
      StatusOS.PENDENTE_EXECUTOR,
    ];
    if (semValor.includes(ordemServico.status)) {
      throw new BadRequestException(
        'Só um atendimento confirmado tem valor a receber',
      );
    }

    const pagoEm = dto.pagoEm ? new Date(dto.pagoEm) : new Date();
    // Uma pequena folga para diferenças de fuso entre o navegador e o servidor
    if (pagoEm.getTime() > Date.now() + 86_400_000) {
      throw new BadRequestException('A data do recebimento não pode ser no futuro');
    }

    return this.prisma.ordemServico.update({
      where: { id: ordemServicoId },
      data: { pagoEm, formaPagamento: dto.formaPagamento ?? null },
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

    // Pode registrar com o atendimento em andamento, ou depois do horário marcado
    // quando o profissional fez o serviço mas não apertou "iniciar" ("já concluído")
    const emAndamento = ordemServico.status === StatusOS.EXECUTANDO;
    const jaConcluidoSemIniciar =
      ordemServico.status === StatusOS.AGENDADO &&
      ordemServico.dataAgendada <= new Date();
    if (!emAndamento && !jaConcluidoSemIniciar) {
      throw new BadRequestException(
        'O relatório só pode ser registrado com o atendimento em andamento ou depois do horário marcado',
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
    if (!servico || servico.empresaId !== empresaId || !servico.ativo || !servico.aprovado) {
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

    // Vale o preço próprio do passeador (aprovado pelo admin), se ele tiver um
    return {
      servicoId: item.servicoId,
      vinculoExecutorId: item.vinculoExecutorId,
      valor: Number(associacao.valor ?? servico.valor),
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

    const envolvido =
      vinculo.papel === PapelVinculo.CLIENTE
        ? ordemServico.vinculoClienteId === vinculo.id
        : vinculo.papel === PapelVinculo.EXECUTOR &&
          ordemServico.itens.some((item) => item.vinculoExecutorId === vinculo.id);

    const permitidas = TRANSICOES[vinculo.papel]?.[ordemServico.status] ?? [];
    if (envolvido && permitidas.includes(novoStatus)) return;

    throw new ForbiddenException('Você não pode fazer essa mudança agora');
  }
}

// O que cliente e passeador podem fazer a partir de cada status (o admin pode tudo).
// Quem não criou o pedido é quem aceita ou recusa; quem criou pode desistir.
const TRANSICOES: Partial<Record<PapelVinculo, Partial<Record<StatusOS, StatusOS[]>>>> = {
  [PapelVinculo.CLIENTE]: {
    [StatusOS.PENDENTE_CLIENTE]: [StatusOS.AGENDADO, StatusOS.RECUSADO],
    [StatusOS.PENDENTE_EXECUTOR]: [StatusOS.CANCELADO],
    [StatusOS.AGENDADO]: [StatusOS.CANCELADO],
  },
  [PapelVinculo.EXECUTOR]: {
    [StatusOS.PENDENTE_EXECUTOR]: [StatusOS.AGENDADO, StatusOS.RECUSADO],
    [StatusOS.PENDENTE_CLIENTE]: [StatusOS.CANCELADO],
    [StatusOS.AGENDADO]: [StatusOS.EXECUTANDO, StatusOS.CANCELADO],
    [StatusOS.EXECUTANDO]: [StatusOS.CANCELADO],
  },
};
