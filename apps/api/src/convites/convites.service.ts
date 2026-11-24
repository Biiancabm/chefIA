import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PapelVinculo, StatusVinculo } from '@prisma/client';
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

    let vinculoResponsavelId: string | undefined;
    if (dto.papel === PapelVinculo.CLIENTE && dto.vinculoResponsavelId) {
      const responsavel = await this.prisma.vinculo.findUnique({
        where: { id: dto.vinculoResponsavelId },
      });
      if (
        !responsavel ||
        responsavel.empresaId !== empresaId ||
        responsavel.papel !== PapelVinculo.EXECUTOR ||
        responsavel.status !== StatusVinculo.ATIVO
      ) {
        throw new BadRequestException('Funcionário responsável inválido');
      }
      vinculoResponsavelId = responsavel.id;
    }

    let servicoIds: string[] = [];
    if (dto.papel === PapelVinculo.EXECUTOR && dto.servicoIds?.length) {
      servicoIds = [...new Set(dto.servicoIds)];
      const validos = await this.prisma.servico.count({
        where: { id: { in: servicoIds }, empresaId, ativo: true, aprovado: true },
      });
      if (validos !== servicoIds.length) {
        throw new BadRequestException('Algum dos serviços escolhidos não é válido');
      }
    }

    const convite = await this.prisma.convite.create({
      data: {
        empresaId,
        papel: dto.papel,
        token,
        criadoPorId,
        expiraEm,
        emailConvidado: dto.emailConvidado,
        vinculoResponsavelId,
        servicoIds,
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

    // Cliente já entra ligado ao funcionário escolhido no convite
    const vinculoResponsavelId =
      convite.papel === PapelVinculo.CLIENTE ? convite.vinculoResponsavelId : null;

    const vinculo = vinculoExistente
      ? await this.prisma.vinculo.update({
          where: { id: vinculoExistente.id },
          data: {
            papel: convite.papel,
            status: StatusVinculo.ATIVO,
            vinculoResponsavelId,
          },
        })
      : await this.prisma.vinculo.create({
          data: {
            userId,
            empresaId: convite.empresaId,
            papel: convite.papel,
            status: StatusVinculo.ATIVO,
            vinculoResponsavelId,
          },
        });

    // Passeador já entra habilitado nos serviços escolhidos no convite (os ainda ativos)
    if (convite.papel === PapelVinculo.EXECUTOR && convite.servicoIds.length) {
      const ativos = await this.prisma.servico.findMany({
        where: {
          id: { in: convite.servicoIds },
          empresaId: convite.empresaId,
          ativo: true,
          aprovado: true,
        },
        select: { id: true },
      });
      await this.prisma.executorServico.createMany({
        data: ativos.map((s) => ({ servicoId: s.id, vinculoExecutorId: vinculo.id })),
        skipDuplicates: true,
      });
    }

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
