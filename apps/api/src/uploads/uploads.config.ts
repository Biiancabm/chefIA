import { mkdirSync } from 'fs';
import { join } from 'path';

// Pasta onde as fotos enviadas ficam guardadas (apps/api/uploads)
export const PASTA_UPLOADS = join(process.cwd(), 'uploads');
mkdirSync(PASTA_UPLOADS, { recursive: true });

// Endereço de uma foto enviada por aqui, ex.: /uploads/3f2c...e1.webp
export const REGEX_FOTO = /^\/uploads\/[0-9a-f-]{36}\.(jpg|png|webp)$/;
export const MENSAGEM_FOTO = 'Envie a foto pelo botão de foto';
