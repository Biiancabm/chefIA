import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PapelVinculo,
  Prisma,
  Segmento,
  StatusVinculo,
  Vinculo,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { DefinirRemuneracaoDto } from './dto/definir-remuneracao.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { SERVICOS_SUGERIDOS } from './servicos-sugeridos';

const USER_SEGURO = {
  select: { id: true, nome: true, email: true, telefone: true },
};

const INCLUDE_MEMBRO = {
  user: USER_SEGURO,
  responsavel: { include: { user: USER_SEGURO } },
};

@Injectable()
export class EmpresasService {
  constructor(private readonly prisma: PrismaService) {}

  // Só pode criar empresa quem ainda não participa de nenhuma (novo dono)
  // ou quem já é administrador em alguma. Funcionários e clientes não podem.
  async podeCriarEmpresa(userId: string) {
    const vinculos = await this.prisma.vinculo.findMany({
      where: { userId, status: StatusVinculo.ATIVO },
      select: { papel: true },
    });
    return (
      vinculos.length === 0 ||
      vinculos.some((v) => v.papel === PapelVinculo.ADMIN)
    );
  }

  async create(userId: string, dto: CreateEmpresaDto) {
    if (!(await this.podeCriarEmpresa(userId))) {
      throw new ForbiddenException(
        'Apenas administradores podem criar empresas',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const empresa = await tx.empresa.create({
        data: {
          nome: dto.nome,
          segmento: Segmento.PET,
          modeloRemuneracao: dto.modeloRemuneracao,
          documento: dto.documento,
          telefone: dto.telefone,
          logoUrl: dto.logoUrl ?? null,
          criadoPorId: userId,
        },
      });

      await tx.vinculo.create({
        data: {
          userId,
          empresaId: empresa.id,
          papel: PapelVinculo.ADMIN,
          status: StatusVinculo.ATIVO,
        },
      });

      if (dto.criarServicosSugeridos) {
        await this.criarSugeridos(tx, empresa.id, empresa.segmento);
      }

      return empresa;
    });
  }

  // Adiciona ao catálogo os serviços sugeridos do ramo atual que ainda não existem
  async adicionarServicosSugeridos(empresaId: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });
    if (!empresa) throw new NotFoundException('Empresa não encontrada');

    return this.prisma.$transaction((tx) =>
      this.criarSugeridos(tx, empresaId, empresa.segmento),
    );
  }

  private async criarSugeridos(
    tx: Prisma.TransactionClient,
    empresaId: string,
    segmento: Segmento,
  ) {
    const existentes = await tx.servico.findMany({
      where: { empresaId },
      select: { nome: true },
    });
    const nomesExistentes = new Set(existentes.map((s) => s.nome.toLowerCase()));
    const novos = SERVICOS_SUGERIDOS[segmento].filter(
      (s) => !nomesExistentes.has(s.nome.toLowerCase()),
    );

    // Cria de trás pra frente porque a lista de serviços mostra o mais recente primeiro
    for (const sugerido of [...novos].reverse()) {
      await tx.servico.create({
        data: {
          empresaId,
          nome: sugerido.nome,
          descricao: sugerido.descricao,
          valor: sugerido.valor,
          camposRelatorio: {
            create: sugerido.campos.map((campo, ordem) => ({
              rotulo: campo.rotulo,
              tipo: campo.tipo,
              obrigatorio: campo.obrigatorio ?? false,
              ordem,
            })),
          },
        },
      });
    }

    return { criados: novos.length };
  }

  async findMinhas(userId: string) {
    const vinculos = await this.prisma.vinculo.findMany({
      where: { userId, status: StatusVinculo.ATIVO },
      include: { empresa: true, responsavel: { include: { user: USER_SEGURO } } },
    });

    return vinculos.map((v) => ({
      vinculoId: v.id,
      papel: v.papel,
      empresa: v.empresa,
      // Cliente: o passeador que o atende (para quem ele pede passeios)
      responsavel: v.responsavel
        ? { vinculoId: v.responsavel.id, nome: v.responsavel.user.nome }
        : null,
      // Passeador: quanto ele recebe (para o financeiro dele)
      remuneracao:
        v.papel === PapelVinculo.EXECUTOR
          ? { comissaoPercentual: v.comissaoPercentual, salarioMensal: v.salarioMensal }
          : null,
    }));
  }

  async findOne(empresaId: string) {
    return this.prisma.empresa.findUnique({ where: { id: empresaId } });
  }

  async update(empresaId: string, dto: UpdateEmpresaDto) {
    return this.prisma.empresa.update({
      where: { id: empresaId },
      data: dto,
    });
  }

  async listarMembros(empresaId: string) {
    return this.prisma.vinculo.findMany({
      where: { empresaId, status: StatusVinculo.ATIVO },
      include: INCLUDE_MEMBRO,
      orderBy: { criadoEm: 'asc' },
    });
  }

  // Admin vê todos os clientes; funcionário vê só os clientes pelos quais é responsável
  async listarClientes(empresaId: string, vinculo: Vinculo) {
    return this.prisma.vinculo.findMany({
      where: {
        empresaId,
        papel: PapelVinculo.CLIENTE,
        status: StatusVinculo.ATIVO,
        ...(vinculo.papel === PapelVinculo.EXECUTOR
          ? { vinculoResponsavelId: vinculo.id }
          : {}),
      },
      include: INCLUDE_MEMBRO,
      orderBy: { user: { nome: 'asc' } },
    });
  }

  async definirResponsavel(
    empresaId: string,
    vinculoClienteId: string,
    vinculoResponsavelId: string | null,
  ) {
    const cliente = await this.prisma.vinculo.findUnique({
      where: { id: vinculoClienteId },
    });
    if (
      !cliente ||
      cliente.empresaId !== empresaId ||
      cliente.papel !== PapelVinculo.CLIENTE
    ) {
      throw new NotFoundException('Cliente não encontrado');
    }

    if (vinculoResponsavelId) {
      const responsavel = await this.prisma.vinculo.findUnique({
        where: { id: vinculoResponsavelId },
      });
      if (
        !responsavel ||
        responsavel.empresaId !== empresaId ||
        responsavel.papel !== PapelVinculo.EXECUTOR ||
        responsavel.status !== StatusVinculo.ATIVO
      ) {
        throw new BadRequestException('Funcionário responsável inválido');
      }
    }

    return this.prisma.vinculo.update({
      where: { id: vinculoClienteId },
      data: { vinculoResponsavelId },
      include: INCLUDE_MEMBRO,
    });
  }

  // Comissão (%) ou salário mensal de um passeador
  async definirRemuneracao(
    empresaId: string,
    vinculoId: string,
    dto: DefinirRemuneracaoDto,
  ) {
    const vinculo = await this.prisma.vinculo.findUnique({
      where: { id: vinculoId },
    });
    if (
      !vinculo ||
      vinculo.empresaId !== empresaId ||
      vinculo.papel !== PapelVinculo.EXECUTOR
    ) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    return this.prisma.vinculo.update({
      where: { id: vinculoId },
      data: {
        comissaoPercentual: dto.comissaoPercentual,
        salarioMensal: dto.salarioMensal,
      },
      include: INCLUDE_MEMBRO,
    });
  }

  async desativarMembro(empresaId: string, vinculoId: string) {
    const vinculo = await this.prisma.vinculo.findUnique({
      where: { id: vinculoId },
    });
    if (!vinculo || vinculo.empresaId !== empresaId) {
      throw new NotFoundException('Membro não encontrado');
    }
    if (vinculo.papel === PapelVinculo.ADMIN) {
      throw new BadRequestException(
        'Não é possível remover um administrador por aqui',
      );
    }

    // Funcionário removido: os clientes dele ficam sem responsável até o admin escolher outro
    return this.prisma.$transaction(async (tx) => {
      if (vinculo.papel === PapelVinculo.EXECUTOR) {
        await tx.vinculo.updateMany({
          where: { vinculoResponsavelId: vinculoId },
          data: { vinculoResponsavelId: null },
        });
      }
      return tx.vinculo.update({
        where: { id: vinculoId },
        data: { status: StatusVinculo.INATIVO },
      });
    });
  }
}
