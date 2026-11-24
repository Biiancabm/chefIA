import { applyDecorators } from '@nestjs/common';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

// A logo chega do navegador já reduzida (até 256px) como data URL de imagem.
// null remove a logo. Só formatos de imagem rasterizada são aceitos.
export function IsLogo() {
  return applyDecorators(
    IsOptional(),
    IsString(),
    MaxLength(400_000, { message: 'A imagem da logo é grande demais' }),
    Matches(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/, {
      message: 'A logo precisa ser uma imagem PNG, JPG ou WebP',
    }),
  );
}
