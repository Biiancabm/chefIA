import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PapelVinculo, StatusVinculo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

@Injectable()
export class EmpresasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateEmpresaDto) {
    return this.prisma.$transaction(async (tx) => {
      const empresa = await tx.empresa.create({
        data: {
          nome: dto.nome,
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

      return empresa;
    });
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
