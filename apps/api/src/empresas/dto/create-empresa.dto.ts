import { ModeloRemuneracao } from '@prisma/client';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { IsLogo } from './logo.validator';

export class CreateEmpresaDto {
  @IsNotEmpty()
  nome: string;

  // Como os passeadores são pagos: comissão sobre cada passeio ou salário fixo
  @IsOptional()
  @IsEnum(ModeloRemuneracao)
  modeloRemuneracao?: ModeloRemuneracao;

  // Cria o catálogo inicial de serviços de pets
  @IsOptional()
  @IsBoolean()
  criarServicosSugeridos?: boolean;

  @IsOptional()
  documento?: string;

  @IsOptional()
  telefone?: string;

  @IsLogo()
  logoUrl?: string | null;
}
