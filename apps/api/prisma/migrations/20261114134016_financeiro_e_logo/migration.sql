-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'TRANSFERENCIA', 'OUTRO');

-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "OrdemServico" ADD COLUMN     "formaPagamento" "FormaPagamento",
ADD COLUMN     "pagoEm" TIMESTAMP(3);
