import { IsArray, IsEmail, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PapelVinculo } from '@prisma/client';

export class CreateConviteDto {
  @IsIn([PapelVinculo.EXECUTOR, PapelVinculo.CLIENTE])
  papel: typeof PapelVinculo.EXECUTOR | typeof PapelVinculo.CLIENTE;

  @IsOptional()
  @IsInt()
  @Min(1)
  validadeHoras?: number;

  @IsOptional()
  @IsEmail()
  emailConvidado?: string;

  // Convite de cliente: funcionário que vai atendê-lo
  @IsOptional()
  @IsString()
  vinculoResponsavelId?: string;

  // Convite de passeador: serviços que ele já fica habilitado a fazer ao aceitar
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  servicoIds?: string[];
}
