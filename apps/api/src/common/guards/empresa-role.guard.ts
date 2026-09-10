import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PapelVinculo, StatusVinculo } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class EmpresaRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const empresaId = request.params?.empresaId;
    const userId = request.user?.id;

    if (!empresaId || !userId) {
      throw new ForbiddenException('Acesso negado a essa empresa');
    }

    const vinculo = await this.prisma.vinculo.findUnique({
      where: { userId_empresaId: { userId, empresaId } },
    });

    if (!vinculo || vinculo.status !== StatusVinculo.ATIVO) {
      throw new ForbiddenException('Acesso negado a essa empresa');
    }

    const papeisPermitidos = this.reflector.getAllAndOverride<PapelVinculo[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (papeisPermitidos?.length && !papeisPermitidos.includes(vinculo.papel)) {
      throw new ForbiddenException('Você não tem permissão para essa ação');
    }

    request.vinculo = vinculo;
    return true;
  }
}
