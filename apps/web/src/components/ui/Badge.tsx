import type { StatusOS } from '../../types';

const STATUS_LABEL: Record<StatusOS, string> = {
  AGENDADO: 'Agendado',
  EXECUTANDO: 'Executando',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
  RECEBIDO: 'Recebido',
};

const STATUS_CLASSES: Record<StatusOS, string> = {
  AGENDADO: 'bg-status-agendado-bg text-status-agendado-text',
  EXECUTANDO: 'bg-status-executando-bg text-status-executando-text',
  FINALIZADO: 'bg-status-finalizado-bg text-status-finalizado-text',
  CANCELADO: 'bg-status-cancelado-bg text-status-cancelado-text',
  RECEBIDO: 'bg-status-recebido-bg text-status-recebido-text',
};

export function StatusBadge({ status }: { status: StatusOS }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
