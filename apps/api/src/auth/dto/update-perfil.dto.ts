import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdatePerfilDto {
  @IsOptional()
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  telefone?: string;
}
