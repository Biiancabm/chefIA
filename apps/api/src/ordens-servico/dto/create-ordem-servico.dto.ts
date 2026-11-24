import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ItemOrdemServicoDto } from './item-ordem-servico.dto';

export class CreateOrdemServicoDto {
  // Admin e passeador escolhem o cliente; o cliente pede sempre para si
  @IsOptional()
  @IsString()
  vinculoClienteId?: string;

  // Quem recebe o cuidado (o pet, a criança...), se o ramo usa esse cadastro
  @IsOptional()
  @IsString()
  assistidoId?: string;

  @IsDateString()
  dataAgendada: string;

  @IsOptional()
  observacoes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemOrdemServicoDto)
  itens: ItemOrdemServicoDto[];
}
