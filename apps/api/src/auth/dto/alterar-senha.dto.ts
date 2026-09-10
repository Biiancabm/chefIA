import { IsNotEmpty, MinLength } from 'class-validator';

export class AlterarSenhaDto {
  @IsNotEmpty()
  senhaAtual: string;

  @MinLength(6)
  novaSenha: string;
}
