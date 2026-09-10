import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateServicoDto {
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsNumber()
  @IsPositive()
  valor: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fotos?: string[];
}
