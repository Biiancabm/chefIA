import { IsBoolean, IsNumber, IsPositive } from 'class-validator';

// Passeador pede um novo preço para um serviço que ele faz
export class ProporPrecoDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  valor: number;
}

// Administrador aprova ou recusa o pedido (novo preço ou novo serviço)
export class ResponderPrecoDto {
  @IsBoolean()
  aprovar: boolean;
}
