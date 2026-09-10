-- CreateEnum
CREATE TYPE "TipoCampoRelatorio" AS ENUM ('CHECKBOX', 'TEXTO_CURTO', 'TEXTO_LONGO');

-- CreateTable
CREATE TABLE "CampoRelatorio" (
    "id" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,
    "rotulo" TEXT NOT NULL,
    "tipo" "TipoCampoRelatorio" NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampoRelatorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relatorio" (
    "id" TEXT NOT NULL,
    "ordemServicoItemId" TEXT NOT NULL,
    "horaInicio" TIMESTAMP(3) NOT NULL,
    "horaFim" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "fotos" TEXT[],
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Relatorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelatorioValor" (
    "id" TEXT NOT NULL,
    "relatorioId" TEXT NOT NULL,
    "campoId" TEXT NOT NULL,
    "valor" TEXT NOT NULL,

    CONSTRAINT "RelatorioValor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Relatorio_ordemServicoItemId_key" ON "Relatorio"("ordemServicoItemId");

-- CreateIndex
CREATE UNIQUE INDEX "RelatorioValor_relatorioId_campoId_key" ON "RelatorioValor"("relatorioId", "campoId");

-- AddForeignKey
ALTER TABLE "CampoRelatorio" ADD CONSTRAINT "CampoRelatorio_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relatorio" ADD CONSTRAINT "Relatorio_ordemServicoItemId_fkey" FOREIGN KEY ("ordemServicoItemId") REFERENCES "OrdemServicoItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatorioValor" ADD CONSTRAINT "RelatorioValor_relatorioId_fkey" FOREIGN KEY ("relatorioId") REFERENCES "Relatorio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatorioValor" ADD CONSTRAINT "RelatorioValor_campoId_fkey" FOREIGN KEY ("campoId") REFERENCES "CampoRelatorio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
