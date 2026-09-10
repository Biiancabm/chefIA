import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ItemOrdemServicoDto } from './item-ordem-servico.dto';

export class CreateOrdemServicoDto {
  @IsNotEmpty()
  vinculoClienteId: string;

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
