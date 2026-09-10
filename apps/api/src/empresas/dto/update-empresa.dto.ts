import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateEmpresaDto {
  @IsOptional()
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  documento?: string;

  @IsOptional()
  telefone?: string;
}
