-- CreateEnum
CREATE TYPE "Segmento" AS ENUM ('PET', 'CONSTRUCAO', 'LIMPEZA', 'BELEZA', 'MANUTENCAO', 'AULAS', 'OUTRO');

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "segmento" "Segmento" NOT NULL DEFAULT 'OUTRO';
