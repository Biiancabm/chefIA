import { IsNotEmpty } from 'class-validator';

export class AdicionarExecutorDto {
  @IsNotEmpty()
  vinculoExecutorId: string;
}
