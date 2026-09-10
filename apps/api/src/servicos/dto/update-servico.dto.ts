import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateServicoDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  valor?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fotos?: string[];

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
