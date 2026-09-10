import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class ValorCampoDto {
  @IsNotEmpty()
  campoId: string;

  @IsString()
  valor: string;
}

export class CreateRelatorioDto {
  @IsDateString()
  horaInicio: string;

  @IsDateString()
  horaFim: string;

  @IsOptional()
  observacoes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fotos?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValorCampoDto)
  valores?: ValorCampoDto[];
}
