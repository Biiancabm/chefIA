import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  senha: string;

  @IsOptional()
  telefone?: string;
}
