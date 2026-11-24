import { ModeloRemuneracao } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { IsLogo } from './logo.validator';

export class UpdateEmpresaDto {
  @IsOptional()
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  @IsEnum(ModeloRemuneracao)
  modeloRemuneracao?: ModeloRemuneracao;

  @IsOptional()
  documento?: string;

  @IsOptional()
  telefone?: string;

  @IsLogo()
  logoUrl?: string | null;
}
