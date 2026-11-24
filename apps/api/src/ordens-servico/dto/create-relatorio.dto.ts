import { Type } from 'class-transformer';
import { MENSAGEM_FOTO, REGEX_FOTO } from '../../uploads/uploads.config';
import {
  ArrayMaxSize,
  Matches,
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

  // Fotos enviadas antes por /uploads
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @Matches(REGEX_FOTO, { each: true, message: MENSAGEM_FOTO })
  fotos?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValorCampoDto)
  valores?: ValorCampoDto[];
}
