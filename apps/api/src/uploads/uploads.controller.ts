import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PASTA_UPLOADS } from './uploads.config';

const EXTENSOES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

// Recebe uma foto (pet, relatório do passeio) e devolve o endereço dela.
// O navegador já reduz a imagem antes de enviar.
@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: diskStorage({
        destination: PASTA_UPLOADS,
        filename: (_req, arquivo, cb) => cb(null, `${randomUUID()}${EXTENSOES[arquivo.mimetype]}`),
      }),
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
      fileFilter: (_req, arquivo, cb) => {
        if (EXTENSOES[arquivo.mimetype]) return cb(null, true);
        cb(new BadRequestException('Envie uma imagem JPG, PNG ou WebP'), false);
      },
    }),
  )
  enviar(@UploadedFile() arquivo?: Express.Multer.File) {
    if (!arquivo) {
      throw new BadRequestException('Nenhuma imagem enviada');
    }
    return { url: `/uploads/${arquivo.filename}` };
  }
}
