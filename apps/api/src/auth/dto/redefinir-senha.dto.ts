import { IsNotEmpty, MinLength } from 'class-validator';

export class RedefinirSenhaDto {
  @IsNotEmpty()
  token: string;

  @MinLength(6)
  novaSenha: string;
}
