import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateEmpresaDto {
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  documento?: string;

  @IsOptional()
  telefone?: string;
}
