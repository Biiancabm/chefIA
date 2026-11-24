import { IsOptional, IsString } from 'class-validator';

export class DefinirResponsavelDto {
  // null tira o responsável do cliente
  @IsOptional()
  @IsString()
  vinculoResponsavelId: string | null;
}
