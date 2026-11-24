import type { OrdemServico } from '../types';

// Já chegou (ou passou) o horário marcado?
export function horarioPassou(os: OrdemServico) {
  return new Date(os.dataAgendada).getTime() <= Date.now();
}

// O funcionário está designado em algum serviço dessa OS?
export function souExecutorDaOs(os: OrdemServico, vinculoId: string) {
  return os.itens.some((item) => item.vinculoExecutorId === vinculoId);
}

// O que o funcionário pode fazer agora com essa OS
export type AcaoFuncionario = 'responder' | 'iniciar' | 'ja-concluido' | 'registrar' | null;

export function acaoDoFuncionario(os: OrdemServico, vinculoId: string): AcaoFuncionario {
  if (!souExecutorDaOs(os, vinculoId)) return null;
  const faltaRelatorio = os.itens.some(
    (item) => item.vinculoExecutorId === vinculoId && !item.relatorio,
  );
  // Cliente pediu: o passeador precisa aceitar ou recusar
  if (os.status === 'PENDENTE_EXECUTOR') return 'responder';
  if (os.status === 'EXECUTANDO') return faltaRelatorio ? 'registrar' : null;
  if (os.status === 'AGENDADO') {
    if (!horarioPassou(os)) return 'iniciar';
    return faltaRelatorio ? 'ja-concluido' : null;
  }
  return null;
}
