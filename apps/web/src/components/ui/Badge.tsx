import type { ReactNode } from 'react';
import type { StatusOS } from '../../types';

export const STATUS_LABEL: Record<StatusOS, string> = {
  PENDENTE_EXECUTOR: 'Aguardando passeador',
  PENDENTE_CLIENTE: 'Aguardando cliente',
  AGENDADO: 'Agendado',
  EXECUTANDO: 'Em andamento',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
  RECUSADO: 'Recusado',
  RECEBIDO: 'Recebido',
};

// Um ponto de cor + texto: tracejado para o pedido que falta aceitar, violeta para o que está por vir ou acontecendo, verde para o concluído
const ESTILO: Record<StatusOS, { caixa: string; ponto: string }> = {
  PENDENTE_EXECUTOR: { caixa: 'border border-dashed border-primary/60 text-primary-text', ponto: 'bg-primary/60' },
  PENDENTE_CLIENTE: { caixa: 'border border-dashed border-primary/60 text-primary-text', ponto: 'bg-primary/60' },
  AGENDADO: { caixa: 'bg-primary-soft text-primary-text', ponto: 'bg-primary/60' },
  EXECUTANDO: { caixa: 'bg-primary text-white', ponto: 'bg-white animate-pulse' },
  FINALIZADO: { caixa: 'bg-ok-soft text-ok', ponto: 'bg-ok' },
  CANCELADO: { caixa: 'bg-surface text-text-subtle', ponto: 'bg-text-subtle/60' },
  RECUSADO: { caixa: 'bg-surface text-text-subtle', ponto: 'bg-text-subtle/60' },
  RECEBIDO: { caixa: 'bg-ok-soft text-ok', ponto: 'bg-ok' },
};

export function StatusBadge({ status }: { status: StatusOS }) {
  const e = ESTILO[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium leading-5 ${e.caixa}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${e.ponto}`} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

// Etiqueta pequena (Inativo, Administrador...)
export function Tag({
  children,
  tom = 'neutro',
}: {
  children: ReactNode;
  tom?: 'neutro' | 'acento' | 'perigo' | 'verde';
}) {
  const cls = {
    neutro: 'bg-surface text-text-muted',
    acento: 'bg-primary-soft text-primary-text',
    perigo: 'bg-danger-soft text-danger',
    verde: 'bg-ok-soft text-ok',
  }[tom];
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium leading-4 ${cls}`}>
      {children}
    </span>
  );
}
