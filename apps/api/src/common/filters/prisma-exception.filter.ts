import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const mapeada = this.mapear(exception);
    const response = host.switchToHttp().getResponse();
    const status = mapeada.getStatus();
    response.status(status).json(mapeada.getResponse());
  }

  private mapear(exception: Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002':
        return new ConflictException('Esse registro já existe');
      case 'P2025':
        return new NotFoundException('Registro não encontrado');
      default:
        return new ConflictException('Não foi possível completar a operação');
    }
  }
}
