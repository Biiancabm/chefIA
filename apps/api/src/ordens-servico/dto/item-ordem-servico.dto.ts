import { IsNotEmpty } from 'class-validator';

export class ItemOrdemServicoDto {
  @IsNotEmpty()
  servicoId: string;

  @IsNotEmpty()
  vinculoExecutorId: string;
}
