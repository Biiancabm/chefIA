import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PapelVinculo, Prisma, Segmento, StatusVinculo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { SERVICOS_SUGERIDOS } from './servicos-sugeridos';

@Injectable()
export class EmpresasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateEmpresaDto) {
    return this.prisma.$transaction(async (tx) => {
      const empresa = await tx.empresa.create({
        data: {
          nome: dto.nome,
          segmento: dto.segmento,
          documento: dto.documento,
          telefone: dto.telefone,
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
      include: { empresa: true },
    });

    return vinculos.map((v) => ({
      vinculoId: v.id,
      papel: v.papel,
      empresa: v.empresa,
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
      include: {
        user: { select: { id: true, nome: true, email: true, telefone: true } },
      },
      orderBy: { criadoEm: 'asc' },
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

    return this.prisma.vinculo.update({
      where: { id: vinculoId },
      data: { status: StatusVinculo.INATIVO },
    });
  }
}
