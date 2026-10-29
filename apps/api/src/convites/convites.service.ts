import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatusVinculo } from '@prisma/client';
import { randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConviteDto } from './dto/create-convite.dto';

const VALIDADE_HORAS_PADRAO = 72;

@Injectable()
export class ConvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async create(empresaId: string, criadoPorId: string, dto: CreateConviteDto) {
    const validadeHoras = dto.validadeHoras ?? VALIDADE_HORAS_PADRAO;
    const expiraEm = new Date(Date.now() + validadeHoras * 60 * 60 * 1000);
    const token = randomBytes(24).toString('base64url');

    const convite = await this.prisma.convite.create({
      data: {
        empresaId,
        papel: dto.papel,
        token,
        criadoPorId,
        expiraEm,
        emailConvidado: dto.emailConvidado,
      },
      include: { empresa: true },
    });

    if (convite.emailConvidado) {
      await this.mailService.enviarConvite({
        para: convite.emailConvidado,
        empresaNome: convite.empresa.nome,
        papel: convite.papel,
        token: convite.token,
        expiraEm: convite.expiraEm,
      });
    }

    return convite;
  }

  async findAtivosDaEmpresa(empresaId: string) {
    return this.prisma.convite.findMany({
      where: { empresaId, expiraEm: { gt: new Date() } },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async revogar(empresaId: string, conviteId: string) {
    const convite = await this.prisma.convite.findUnique({
      where: { id: conviteId },
    });
    if (!convite || convite.empresaId !== empresaId) {
      throw new NotFoundException('Convite não encontrado');
    }

    await this.prisma.convite.delete({ where: { id: conviteId } });
  }

  async preview(token: string) {
    const convite = await this.buscarValido(token);
    return {
      empresa: {
        id: convite.empresa.id,
        nome: convite.empresa.nome,
        segmento: convite.empresa.segmento,
      },
      papel: convite.papel,
    };
  }

  async aceitar(token: string, userId: string) {
    const convite = await this.buscarValido(token);

    if (convite.emailConvidado) {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
      });
      if (user.email.toLowerCase() !== convite.emailConvidado.toLowerCase()) {
        throw new ForbiddenException(
          'Esse convite foi enviado para outro email. Entre com a conta correspondente para aceitá-lo.',
        );
      }
    }

    const vinculoExistente = await this.prisma.vinculo.findUnique({
      where: {
        userId_empresaId: { userId, empresaId: convite.empresaId },
      },
    });

    if (vinculoExistente && vinculoExistente.status === StatusVinculo.ATIVO) {
      throw new ConflictException('Você já faz parte dessa empresa');
    }

    const vinculo = vinculoExistente
      ? await this.prisma.vinculo.update({
          where: { id: vinculoExistente.id },
          data: { papel: convite.papel, status: StatusVinculo.ATIVO },
        })
      : await this.prisma.vinculo.create({
          data: {
            userId,
            empresaId: convite.empresaId,
            papel: convite.papel,
            status: StatusVinculo.ATIVO,
          },
        });

    await this.prisma.convite.update({
      where: { id: convite.id },
      data: { usadoEm: new Date() },
    });

    return vinculo;
  }

  private async buscarValido(token: string) {
    const convite = await this.prisma.convite.findUnique({
      where: { token },
      include: { empresa: true },
    });

    if (!convite) {
      throw new NotFoundException('Convite não encontrado');
    }
    if (convite.expiraEm < new Date()) {
      throw new ForbiddenException('Esse convite expirou');
    }

    return convite;
  }
}
