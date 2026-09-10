import { IsEnum } from 'class-validator';
import { StatusOS } from '@prisma/client';

export class UpdateStatusOrdemServicoDto {
  @IsEnum(StatusOS)
  status: StatusOS;
}
