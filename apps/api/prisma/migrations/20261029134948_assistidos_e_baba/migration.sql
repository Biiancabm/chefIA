-- AlterEnum
ALTER TYPE "Segmento" ADD VALUE 'BABA';

-- AlterTable
ALTER TABLE "OrdemServico" ADD COLUMN     "assistidoId" TEXT;

-- CreateTable
CREATE TABLE "Assistido" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "vinculoClienteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "dados" JSONB NOT NULL DEFAULT '{}',
    "informacoes" TEXT[],
    "lembretes" TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assistido_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_assistidoId_fkey" FOREIGN KEY ("assistidoId") REFERENCES "Assistido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assistido" ADD CONSTRAINT "Assistido_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assistido" ADD CONSTRAINT "Assistido_vinculoClienteId_fkey" FOREIGN KEY ("vinculoClienteId") REFERENCES "Vinculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
