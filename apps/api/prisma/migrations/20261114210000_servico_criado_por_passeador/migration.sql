-- AlterTable
ALTER TABLE "Servico" ADD COLUMN     "aprovado" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "criadoPorVinculoId" TEXT;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_criadoPorVinculoId_fkey" FOREIGN KEY ("criadoPorVinculoId") REFERENCES "Vinculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

