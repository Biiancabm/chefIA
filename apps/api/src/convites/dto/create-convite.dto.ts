import { IsEmail, IsIn, IsInt, IsOptional, Min } from 'class-validator';
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
}
