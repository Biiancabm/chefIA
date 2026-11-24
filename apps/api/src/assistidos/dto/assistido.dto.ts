import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { MENSAGEM_FOTO, REGEX_FOTO } from '../../uploads/uploads.config';

export class CreateAssistidoDto {
  @IsNotEmpty()
  @MaxLength(120)
  nome: string;

  // Admin informa de qual cliente é; o cliente cadastra sempre para si mesmo
  @IsOptional()
  @IsString()
  vinculoClienteId?: string;

  // Foto enviada por /uploads; texto vazio tira a foto
  @IsOptional()
  @IsString()
  @Matches(new RegExp(`^$|${REGEX_FOTO.source}`), { message: MENSAGEM_FOTO })
  fotoUrl?: string;

  // Campos do ramo, ex.: { raca: "Golden", porte: "Grande" }
  @IsOptional()
  @IsObject()
  dados?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  informacoes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lembretes?: string[];
}

export class UpdateAssistidoDto {
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(120)
  nome?: string;

  // Foto enviada por /uploads; texto vazio tira a foto
  @IsOptional()
  @IsString()
  @Matches(new RegExp(`^$|${REGEX_FOTO.source}`), { message: MENSAGEM_FOTO })
  fotoUrl?: string;

  @IsOptional()
  @IsObject()
  dados?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  informacoes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lembretes?: string[];
}
