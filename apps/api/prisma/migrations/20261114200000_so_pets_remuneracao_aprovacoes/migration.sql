-- Só existe o ramo de pets: as empresas de outros ramos passam a ser de pets
UPDATE "Empresa" SET "segmento" = 'PET' WHERE "segmento" <> 'PET';

-- CreateEnum
CREATE TYPE "ModeloRemuneracao" AS ENUM ('COMISSAO', 'SALARIO');

-- AlterEnum
BEGIN;
CREATE TYPE "Segmento_new" AS ENUM ('PET');
ALTER TABLE "public"."Empresa" ALTER COLUMN "segmento" DROP DEFAULT;
ALTER TABLE "Empresa" ALTER COLUMN "segmento" TYPE "Segmento_new" USING ("segmento"::text::"Segmento_new");
ALTER TYPE "Segmento" RENAME TO "Segmento_old";
ALTER TYPE "Segmento_new" RENAME TO "Segmento";
DROP TYPE "public"."Segmento_old";
ALTER TABLE "Empresa" ALTER COLUMN "segmento" SET DEFAULT 'PET';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StatusOS" ADD VALUE 'PENDENTE_EXECUTOR';
ALTER TYPE "StatusOS" ADD VALUE 'PENDENTE_CLIENTE';
ALTER TYPE "StatusOS" ADD VALUE 'RECUSADO';

-- AlterTable
ALTER TABLE "Convite" ADD COLUMN     "servicoIds" TEXT[];

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "modeloRemuneracao" "ModeloRemuneracao" NOT NULL DEFAULT 'COMISSAO',
ALTER COLUMN "segmento" SET DEFAULT 'PET';

-- AlterTable
ALTER TABLE "ExecutorServico" ADD COLUMN     "propostoEm" TIMESTAMP(3),
ADD COLUMN     "valor" DECIMAL(10,2),
ADD COLUMN     "valorProposto" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Vinculo" ADD COLUMN     "comissaoPercentual" DECIMAL(5,2),
ADD COLUMN     "salarioMensal" DECIMAL(10,2);

