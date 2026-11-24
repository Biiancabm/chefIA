import { IsNumber, IsOptional, Max, Min } from 'class-validator';

// Quanto o passeador recebe. null limpa o valor.
export class DefinirRemuneracaoDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  comissaoPercentual?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salarioMensal?: number | null;
}
