-- AlterTable
ALTER TABLE "Convite" ADD COLUMN     "vinculoResponsavelId" TEXT;

-- AlterTable
ALTER TABLE "Vinculo" ADD COLUMN     "vinculoResponsavelId" TEXT;

-- AddForeignKey
ALTER TABLE "Vinculo" ADD CONSTRAINT "Vinculo_vinculoResponsavelId_fkey" FOREIGN KEY ("vinculoResponsavelId") REFERENCES "Vinculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convite" ADD CONSTRAINT "Convite_vinculoResponsavelId_fkey" FOREIGN KEY ("vinculoResponsavelId") REFERENCES "Vinculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
