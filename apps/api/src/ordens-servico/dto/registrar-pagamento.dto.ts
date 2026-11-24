import { FormaPagamento } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsOptional } from 'class-validator';

// Marca (ou desmarca) o valor de um atendimento como recebido
export class RegistrarPagamentoDto {
  @IsBoolean()
  pago: boolean;

  @IsOptional()
  @IsEnum(FormaPagamento)
  formaPagamento?: FormaPagamento;

  // Quando o dinheiro entrou; sem data, vale o momento do registro
  @IsOptional()
  @IsDateString()
  pagoEm?: string;
}
