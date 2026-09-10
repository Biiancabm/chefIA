import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { TipoCampoRelatorio } from '@prisma/client';

export class CreateCampoRelatorioDto {
  @IsNotEmpty()
  rotulo: string;

  @IsEnum(TipoCampoRelatorio)
  tipo: TipoCampoRelatorio;

  @IsOptional()
  @IsBoolean()
  obrigatorio?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;
}
