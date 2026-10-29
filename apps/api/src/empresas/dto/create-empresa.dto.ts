import { Segmento } from '@prisma/client';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateEmpresaDto {
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  @IsEnum(Segmento)
  segmento?: Segmento;

  // Cria o catálogo inicial de serviços sugerido para o ramo escolhido
  @IsOptional()
  @IsBoolean()
  criarServicosSugeridos?: boolean;

  @IsOptional()
  documento?: string;

  @IsOptional()
  telefone?: string;
}
