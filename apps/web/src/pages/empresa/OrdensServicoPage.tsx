import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, ChevronRight, PlayCircle, Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { api } from '../../lib/api';
import { formatarData, formatarDataHora, formatarMoeda } from '../../lib/format';
import { texto } from '../../lib/segmentos';
import type { Membro, OrdemServico, Servico } from '../../types';
import type { EmpresaOutletContext } from './EmpresaLayout';

type Termos = EmpresaOutletContext['termos'];

function resumoServicos(os: OrdemServico) {
  return os.itens.map((i) => i.servico.nome).join(', ');
}

export function OrdensServicoPage() {
  const { empresaId, papel, termos } = useOutletContext<EmpresaOutletContext>();
  const navigate = useNavigate();
  const [formAberto, setFormAberto] = useState(false);

  const { data: ordens, isLoading } = useQuery({
    queryKey: ['ordens-servico', empresaId],
    queryFn: async () =>
      (await api.get<OrdemServico[]>(`/empresas/${empresaId}/ordens-servico`)).data,
  });

  if (isLoading) {
    return <p className="text-text-muted">Carregando...</p>;
  }

  if (papel === 'CLIENTE') {
    return <HistoricoCliente termos={termos} ordens={ordens ?? []} onAbrir={(id) => navigate(id)} />;
  }

  const podeCriar = papel === 'ADMIN' || papel === 'EXECUTOR';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">{termos.ordem.plural}</h1>
          <p className="text-sm text-text-muted">
            {papel === 'ADMIN'
              ? `${texto.todos(termos.ordem)} ${texto.agendado(termos.ordem)}s e em andamento`
              : `${termos.ordem.plural} em que você está designado`}
          </p>
        </div>
        {podeCriar && (
          <Button onClick={() => setFormAberto(true)}>
            <Plus size={16} />
            {texto.novo(termos.ordem)}
          </Button>
        )}
      </div>

      {!ordens?.length && (
        <EmptyState
          icon={CalendarClock}
          title={texto.nenhum(termos.ordem)}
          description={`Quando ${texto.um(termos.ordem)} for ${texto.agendado(termos.ordem)}, aparece aqui.`}
          action={
            podeCriar ? (
              <Button variant="secondary" onClick={() => setFormAberto(true)}>
                {texto.novo(termos.ordem)}
              </Button>
            ) : undefined
          }
        />
      )}

      {!!ordens?.length && (
        <Card className="divide-y divide-border p-0">
          {ordens.map((os) => (
            <button
              key={os.id}
              onClick={() => navigate(os.id)}
              className="flex w-full flex-wrap items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-surface"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text">{os.vinculoCliente.user.nome}</p>
                <p className="truncate text-sm text-text-muted">{resumoServicos(os)}</p>
              </div>
              <p className="w-40 shrink-0 text-sm text-text-muted">
                {formatarDataHora(os.dataAgendada)}
              </p>
              <p className="w-24 shrink-0 text-right font-semibold text-text">
                {formatarMoeda(os.valorTotal)}
              </p>
              <div className="w-28 shrink-0 text-right">
                <StatusBadge status={os.status} />
              </div>
            </button>
          ))}
        </Card>
      )}

      {podeCriar && (
        <NovaOsModal
          open={formAberto}
          empresaId={empresaId}
          termos={termos}
          onClose={() => setFormAberto(false)}
        />
      )}
    </div>
  );
}

function HistoricoCliente({
  termos,
  ordens,
  onAbrir,
}: {
  termos: Termos;
  ordens: OrdemServico[];
  onAbrir: (id: string) => void;
}) {
  const emAndamento = ordens.find((o) => o.status === 'EXECUTANDO');
  const proxima = ordens
    .filter((o) => o.status === 'AGENDADO')
    .sort((a, b) => new Date(a.dataAgendada).getTime() - new Date(b.dataAgendada).getTime())[0];
  const destaque = emAndamento ?? proxima;

  const historico = ordens
    .filter((o) => o.id !== destaque?.id)
    .sort((a, b) => new Date(b.dataAgendada).getTime() - new Date(a.dataAgendada).getTime());

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-text">Seu histórico</h1>
        <p className="text-sm text-text-muted">Acompanhe {texto.os(termos.ordem)} dessa empresa</p>
      </div>

      {destaque && (
        <button onClick={() => onAbrir(destaque.id)} className="text-left">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-hover p-6 text-white shadow-[0_8px_24px_color-mix(in_srgb,var(--color-primary)_28%,transparent)] transition-transform hover:-translate-y-0.5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  {destaque.status === 'EXECUTANDO' ? (
                    <PlayCircle size={18} />
                  ) : (
                    <CalendarClock size={18} />
                  )}
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
                  {destaque.status === 'EXECUTANDO' ? 'Em andamento agora' : texto.proximo(termos.ordem)}
                </span>
              </div>
              <ChevronRight size={18} className="text-white/70" />
            </div>
            <p className="text-lg font-semibold">{resumoServicos(destaque)}</p>
            <p className="mt-1 text-sm text-white/80">{formatarDataHora(destaque.dataAgendada)}</p>

            {destaque.status === 'EXECUTANDO' && (
              <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-1/3 animate-[progresso_1.6s_ease-in-out_infinite] rounded-full bg-white" />
              </div>
            )}
          </div>
        </button>
      )}

      <div>
        <h2 className="mb-3 text-sm font-medium text-text-muted">Histórico</h2>
        {!historico.length ? (
          <EmptyState
            icon={CalendarClock}
            title="Nada por aqui ainda"
            description={`${texto.seus(termos.ordem)} ${texto.concluidos(termos.ordem)} vão aparecer nessa lista.`}
          />
        ) : (
          <Card className="divide-y divide-border p-0">
            {historico.map((os) => (
              <button
                key={os.id}
                onClick={() => onAbrir(os.id)}
                className="flex w-full flex-wrap items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-surface"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text">{resumoServicos(os)}</p>
                  <p className="text-sm text-text-muted">{formatarData(os.dataAgendada)}</p>
                </div>
                <StatusBadge status={os.status} />
              </button>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

function NovaOsModal({
  open,
  empresaId,
  termos,
  onClose,
}: {
  open: boolean;
  empresaId: string;
  termos: Termos;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [vinculoClienteId, setVinculoClienteId] = useState('');
  const [dataAgendada, setDataAgendada] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState([{ servicoId: '', vinculoExecutorId: '' }]);

  const { data: membros } = useQuery({
    queryKey: ['membros', empresaId],
    queryFn: async () => (await api.get<Membro[]>(`/empresas/${empresaId}/membros`)).data,
    enabled: open,
  });
  const { data: servicos } = useQuery({
    queryKey: ['servicos', empresaId],
    queryFn: async () => (await api.get<Servico[]>(`/empresas/${empresaId}/servicos`)).data,
    enabled: open,
  });

  const clientes = membros?.filter((m) => m.papel === 'CLIENTE') ?? [];

  const mutation = useMutation({
    mutationFn: async () =>
      api.post(`/empresas/${empresaId}/ordens-servico`, {
        vinculoClienteId,
        dataAgendada: new Date(dataAgendada).toISOString(),
        observacoes: observacoes || undefined,
        itens,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico', empresaId] });
      onClose();
      setVinculoClienteId('');
      setDataAgendada('');
      setObservacoes('');
      setItens([{ servicoId: '', vinculoExecutorId: '' }]);
    },
  });

  function atualizarItem(index: number, campo: 'servicoId' | 'vinculoExecutorId', valor: string) {
    setItens((atual) =>
      atual.map((item, i) =>
        i === index
          ? { ...item, [campo]: valor, ...(campo === 'servicoId' ? { vinculoExecutorId: '' } : {}) }
          : item,
      ),
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <Modal open={open} onClose={onClose} title={texto.novo(termos.ordem)}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">{termos.cliente.singular}</label>
          <select
            required
            value={vinculoClienteId}
            onChange={(e) => setVinculoClienteId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
          >
            <option value="">Selecione...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.user.nome}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Data e hora"
          type="datetime-local"
          required
          value={dataAgendada}
          onChange={(e) => setDataAgendada(e.target.value)}
        />

        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-text">Serviços</label>
          {itens.map((item, index) => {
            const servico = servicos?.find((s) => s.id === item.servicoId);
            return (
              <div key={index} className="flex items-end gap-2 rounded-lg border border-border p-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-text-muted">Serviço</label>
                  <select
                    required
                    value={item.servicoId}
                    onChange={(e) => atualizarItem(index, 'servicoId', e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
                  >
                    <option value="">Selecione...</option>
                    {servicos?.filter((s) => s.ativo).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-text-muted">{termos.executor.singular}</label>
                  <select
                    required
                    disabled={!servico}
                    value={item.vinculoExecutorId}
                    onChange={(e) => atualizarItem(index, 'vinculoExecutorId', e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary-light disabled:bg-surface"
                  >
                    <option value="">Selecione...</option>
                    {servico?.executores.map((ex) => (
                      <option key={ex.vinculoExecutorId} value={ex.vinculoExecutorId}>
                        {ex.nome}
                      </option>
                    ))}
                  </select>
                </div>
                {itens.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setItens((atual) => atual.filter((_, i) => i !== index))}
                    className="mb-1 rounded-lg p-2 text-text-subtle hover:bg-surface hover:text-status-cancelado-text"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
          <Button
            type="button"
            variant="ghost"
            className="self-start"
            onClick={() => setItens((atual) => [...atual, { servicoId: '', vinculoExecutorId: '' }])}
          >
            + Adicionar serviço
          </Button>
        </div>

        <Input
          label="Observações (opcional)"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />

        <Button type="submit" loading={mutation.isPending} className="mt-2">
          Agendar {texto.min(termos.ordem)}
        </Button>
        {mutation.isError && (
          <p className="text-sm text-status-cancelado-text">
            Não foi possível criar. Confira os dados e tente de novo.
          </p>
        )}
      </form>
    </Modal>
  );
}
