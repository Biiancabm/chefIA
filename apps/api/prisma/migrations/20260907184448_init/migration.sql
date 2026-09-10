-- CreateEnum
CREATE TYPE "PapelVinculo" AS ENUM ('ADMIN', 'EXECUTOR', 'CLIENTE');

-- CreateEnum
CREATE TYPE "StatusVinculo" AS ENUM ('PENDENTE', 'ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "StatusOS" AS ENUM ('AGENDADO', 'EXECUTANDO', 'FINALIZADO', 'CANCELADO', 'RECEBIDO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "telefone" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "telefone" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vinculo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "papel" "PapelVinculo" NOT NULL,
    "status" "StatusVinculo" NOT NULL DEFAULT 'ATIVO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vinculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Convite" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "papel" "PapelVinculo" NOT NULL,
    "token" TEXT NOT NULL,
    "emailConvidado" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Convite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servico" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "valor" DECIMAL(10,2) NOT NULL,
    "fotos" TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutorServico" (
    "id" TEXT NOT NULL,
    "vinculoExecutorId" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,

    CONSTRAINT "ExecutorServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemServico" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "vinculoClienteId" TEXT NOT NULL,
    "status" "StatusOS" NOT NULL DEFAULT 'AGENDADO',
    "dataAgendada" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "valorTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "criadoPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdemServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemServicoItem" (
    "id" TEXT NOT NULL,
    "ordemServicoId" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,
    "vinculoExecutorId" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrdemServicoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vinculo_userId_empresaId_key" ON "Vinculo"("userId", "empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Convite_token_key" ON "Convite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutorServico_vinculoExecutorId_servicoId_key" ON "ExecutorServico"("vinculoExecutorId", "servicoId");

-- AddForeignKey
ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vinculo" ADD CONSTRAINT "Vinculo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vinculo" ADD CONSTRAINT "Vinculo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convite" ADD CONSTRAINT "Convite_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convite" ADD CONSTRAINT "Convite_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutorServico" ADD CONSTRAINT "ExecutorServico_vinculoExecutorId_fkey" FOREIGN KEY ("vinculoExecutorId") REFERENCES "Vinculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutorServico" ADD CONSTRAINT "ExecutorServico_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_vinculoClienteId_fkey" FOREIGN KEY ("vinculoClienteId") REFERENCES "Vinculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServicoItem" ADD CONSTRAINT "OrdemServicoItem_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServicoItem" ADD CONSTRAINT "OrdemServicoItem_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServicoItem" ADD CONSTRAINT "OrdemServicoItem_vinculoExecutorId_fkey" FOREIGN KEY ("vinculoExecutorId") REFERENCES "Vinculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
