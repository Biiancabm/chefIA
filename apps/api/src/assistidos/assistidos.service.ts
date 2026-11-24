import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PapelVinculo, Prisma, StatusVinculo, Vinculo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssistidoDto, UpdateAssistidoDto } from './dto/assistido.dto';

const INCLUDE_ASSISTIDO = {
  vinculoCliente: {
    include: {
      user: { select: { id: true, nome: true, email: true, telefone: true } },
    },
  },
};

// Remove linhas vazias das listas do briefing
const limparLista = (lista?: string[]) =>
  lista?.map((l) => l.trim()).filter(Boolean);

@Injectable()
export class AssistidosService {
  constructor(private readonly prisma: PrismaService) {}

  // Quem vê o quê:
  // - admin: todos da empresa
  // - cliente: os próprios
  // - funcionário: os dos clientes pelos quais é responsável e os dos atendimentos dele
  private filtroVisibilidade(
    empresaId: string,
    vinculo: Vinculo,
  ): Prisma.AssistidoWhereInput {
    const base = { empresaId, ativo: true };
    if (vinculo.papel === PapelVinculo.ADMIN) return base;
    if (vinculo.papel === PapelVinculo.CLIENTE) {
      return { ...base, vinculoClienteId: vinculo.id };
    }
    return {
      ...base,
      OR: [
        { vinculoCliente: { vinculoResponsavelId: vinculo.id } },
        {
          ordensServico: {
            some: { itens: { some: { vinculoExecutorId: vinculo.id } } },
          },
        },
      ],
    };
  }

  findAll(empresaId: string, vinculo: Vinculo, vinculoClienteId?: string) {
    return this.prisma.assistido.findMany({
      where: {
        ...this.filtroVisibilidade(empresaId, vinculo),
        ...(vinculoClienteId ? { vinculoClienteId } : {}),
      },
      include: INCLUDE_ASSISTIDO,
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(empresaId: string, id: string, vinculo: Vinculo) {
    const assistido = await this.prisma.assistido.findFirst({
      where: { id, ...this.filtroVisibilidade(empresaId, vinculo) },
      include: INCLUDE_ASSISTIDO,
    });
    if (!assistido) throw new NotFoundException('Cadastro não encontrado');
    return assistido;
  }

  async create(empresaId: string, vinculo: Vinculo, dto: CreateAssistidoDto) {
    let vinculoClienteId: string;

    if (vinculo.papel === PapelVinculo.CLIENTE) {
      vinculoClienteId = vinculo.id;
    } else if (vinculo.papel === PapelVinculo.ADMIN) {
      if (!dto.vinculoClienteId) {
        throw new BadRequestException('Informe de qual cliente é esse cadastro');
      }
      const cliente = await this.prisma.vinculo.findUnique({
        where: { id: dto.vinculoClienteId },
      });
      if (
        !cliente ||
        cliente.empresaId !== empresaId ||
        cliente.papel !== PapelVinculo.CLIENTE ||
        cliente.status !== StatusVinculo.ATIVO
      ) {
        throw new BadRequestException('Cliente inválido para essa empresa');
      }
      vinculoClienteId = cliente.id;
    } else {
      throw new ForbiddenException('Só o administrador ou o cliente podem cadastrar');
    }

    return this.prisma.assistido.create({
      data: {
        empresaId,
        vinculoClienteId,
        nome: dto.nome.trim(),
        fotoUrl: dto.fotoUrl?.trim() || null,
        dados: dto.dados ?? {},
        informacoes: limparLista(dto.informacoes) ?? [],
        lembretes: limparLista(dto.lembretes) ?? [],
      },
      include: INCLUDE_ASSISTIDO,
    });
  }

  // Admin, o cliente dono e o funcionário responsável podem editar
  // (o funcionário pode, por exemplo, anotar "puxa a guia nos primeiros minutos")
  async update(
    empresaId: string,
    id: string,
    vinculo: Vinculo,
    dto: UpdateAssistidoDto,
  ) {
    const assistido = await this.findOne(empresaId, id, vinculo);
    const podeEditar =
      vinculo.papel === PapelVinculo.ADMIN ||
      assistido.vinculoClienteId === vinculo.id ||
      assistido.vinculoCliente.vinculoResponsavelId === vinculo.id;
    if (!podeEditar) {
      throw new ForbiddenException('Você não pode editar esse cadastro');
    }

    return this.prisma.assistido.update({
      where: { id },
      data: {
        nome: dto.nome?.trim(),
        fotoUrl: dto.fotoUrl === undefined ? undefined : dto.fotoUrl.trim() || null,
        dados: dto.dados,
        informacoes: limparLista(dto.informacoes),
        lembretes: limparLista(dto.lembretes),
      },
      include: INCLUDE_ASSISTIDO,
    });
  }

  // Remoção "suave": some das listas, mas o histórico dos atendimentos continua
  async remove(empresaId: string, id: string, vinculo: Vinculo) {
    const assistido = await this.findOne(empresaId, id, vinculo);
    const podeRemover =
      vinculo.papel === PapelVinculo.ADMIN ||
      assistido.vinculoClienteId === vinculo.id;
    if (!podeRemover) {
      throw new ForbiddenException('Você não pode remover esse cadastro');
    }
    return this.prisma.assistido.update({
      where: { id },
      data: { ativo: false },
    });
  }
}
