import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ImageOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { api } from '../../lib/api';
import { formatarDataHora, formatarMoeda } from '../../lib/format';
import type { OrdemServico, OrdemServicoItem, StatusOS } from '../../types';
import type { EmpresaOutletContext } from './EmpresaLayout';
import { texto } from '../../lib/segmentos';

type Termos = EmpresaOutletContext['termos'];

function paraDatetimeLocal(iso: string) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function duracaoMinutos(inicio: string, fim: string) {
  return Math.round((new Date(fim).getTime() - new Date(inicio).getTime()) / 60000);
}

export function OrdemServicoDetailPage() {
  const { empresaId, papel, vinculoId, termos } = useOutletContext<EmpresaOutletContext>();
  const { ordemServicoId } = useParams<{ ordemServicoId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: os, isLoading } = useQuery({
    queryKey: ['ordem-servico', ordemServicoId],
    queryFn: async () =>
      (
        await api.get<OrdemServico>(
          `/empresas/${empresaId}/ordens-servico/${ordemServicoId}`,
        )
      ).data,
  });

  const mudarStatus = useMutation({
    mutationFn: async (status: StatusOS) =>
      api.patch(`/empresas/${empresaId}/ordens-servico/${ordemServicoId}/status`, {
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', ordemServicoId] });
      queryClient.invalidateQueries({ queryKey: ['ordens-servico', empresaId] });
    },
  });

  if (isLoading || !os) {
    return <p className="text-text-muted">Carregando...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex w-fit items-center gap-1 text-sm text-text-muted transition-colors hover:text-primary"
      >
        <ChevronLeft size={16} />
        Voltar
      </button>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-subtle">
              {papel === 'CLIENTE' ? termos.ordem.singular : `${termos.cliente.singular}: ${os.vinculoCliente.user.nome}`}
            </p>
            <h1 className="text-lg font-semibold text-text">
              {formatarDataHora(os.dataAgendada)}
            </h1>
          </div>
          <StatusBadge status={os.status} />
        </div>
        {os.observacoes && (
          <p className="mt-3 text-sm text-text-muted">{os.observacoes}</p>
        )}
        <p className="mt-3 text-sm font-medium text-text">
          Total: {formatarMoeda(os.valorTotal)}
        </p>

        {papel === 'ADMIN' && os.status === 'AGENDADO' && (
          <div className="mt-4 flex gap-2 border-t border-border pt-4">
            <Button
              variant="secondary"
              loading={mudarStatus.isPending}
              onClick={() => mudarStatus.mutate('EXECUTANDO')}
            >
              Iniciar {texto.min(termos.ordem)}
            </Button>
            <Button
              variant="danger"
              loading={mudarStatus.isPending}
              onClick={() => mudarStatus.mutate('CANCELADO')}
            >
              Cancelar
            </Button>
          </div>
        )}

        {papel === 'CLIENTE' && os.status === 'FINALIZADO' && (
          <div className="mt-4 border-t border-border pt-4">
            <Button
              loading={mudarStatus.isPending}
              onClick={() => mudarStatus.mutate('RECEBIDO')}
            >
              Confirmar recebimento
            </Button>
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-4">
        {os.itens.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            osStatus={os.status}
            empresaId={empresaId}
            ordemServicoId={os.id}
            papel={papel}
            termos={termos}
            souExecutorDoItem={item.vinculoExecutorId === vinculoId}
            onAtualizado={() => {
              queryClient.invalidateQueries({ queryKey: ['ordem-servico', ordemServicoId] });
              queryClient.invalidateQueries({ queryKey: ['ordens-servico', empresaId] });
            }}
          />
        ))}
      </div>

      {papel !== 'CLIENTE' && os.status === 'EXECUTANDO' && (
        <div className="flex justify-end">
          <Button
            variant="danger"
            loading={mudarStatus.isPending}
            onClick={() => mudarStatus.mutate('CANCELADO')}
          >
            Cancelar {texto.min(termos.ordem)}
          </Button>
        </div>
      )}
    </div>
  );
}

function ItemCard({
  item,
  osStatus,
  empresaId,
  ordemServicoId,
  papel,
  termos,
  souExecutorDoItem,
  onAtualizado,
}: {
  termos: Termos;
  item: OrdemServicoItem;
  osStatus: StatusOS;
  empresaId: string;
  ordemServicoId: string;
  papel: string;
  souExecutorDoItem: boolean;
  onAtualizado: () => void;
}) {
  const podePreencher =
    papel === 'EXECUTOR' && souExecutorDoItem && osStatus === 'EXECUTANDO' && !item.relatorio;

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-text">{item.servico.nome}</p>
          <p className="text-sm text-text-muted">
            {termos.executor.singular}: {item.vinculoExecutor.user.nome}
          </p>
        </div>
        <p className="font-semibold text-text">{formatarMoeda(item.valor)}</p>
      </div>

      {item.relatorio ? (
        <RelatorioLeitura item={item} />
      ) : podePreencher ? (
        <RelatorioForm
          item={item}
          empresaId={empresaId}
          termos={termos}
          ordemServicoId={ordemServicoId}
          onSalvo={onAtualizado}
        />
      ) : (
        <p className="mt-4 border-t border-border pt-4 text-sm text-text-subtle">
          {osStatus === 'AGENDADO'
            ? `Aguardando início ${texto.doDa(termos.ordem)}.`
            : 'Relatório ainda não disponível.'}
        </p>
      )}
    </Card>
  );
}

function RelatorioLeitura({ item }: { item: OrdemServicoItem }) {
  const relatorio = item.relatorio!;
  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex gap-6 text-sm">
        <div>
          <p className="text-text-subtle">Duração</p>
          <p className="font-medium text-text">
            {duracaoMinutos(relatorio.horaInicio, relatorio.horaFim)} min
          </p>
        </div>
        <div>
          <p className="text-text-subtle">Horário</p>
          <p className="font-medium text-text">
            {formatarDataHora(relatorio.horaInicio)} – {formatarDataHora(relatorio.horaFim)}
          </p>
        </div>
      </div>

      {item.servico.camposRelatorio.map((campo) => {
        const valor = relatorio.valores.find((v) => v.campoId === campo.id)?.valor;
        return (
          <div key={campo.id} className="text-sm">
            <p className="text-text-subtle">{campo.rotulo}</p>
            <p className="font-medium text-text">
              {campo.tipo === 'CHECKBOX' ? (valor === 'true' ? 'Sim' : 'Não') : valor || '—'}
            </p>
          </div>
        );
      })}

      {relatorio.observacoes && (
        <div className="text-sm">
          <p className="text-text-subtle">Observações</p>
          <p className="text-text">{relatorio.observacoes}</p>
        </div>
      )}

      {relatorio.fotos.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto">
          {relatorio.fotos.map((url) => (
            <img key={url} src={url} className="h-20 w-20 rounded-lg object-cover" />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-text-subtle">
          <ImageOff size={14} />
          Nenhuma foto anexada
        </div>
      )}
    </div>
  );
}

function RelatorioForm({
  item,
  empresaId,
  ordemServicoId,
  termos,
  onSalvo,
}: {
  termos: Termos;
  item: OrdemServicoItem;
  empresaId: string;
  ordemServicoId: string;
  onSalvo: () => void;
}) {
  const agora = paraDatetimeLocal(new Date().toISOString());
  const [horaInicio, setHoraInicio] = useState(agora);
  const [horaFim, setHoraFim] = useState(agora);
  const [observacoes, setObservacoes] = useState('');
  const [fotosTexto, setFotosTexto] = useState('');
  const [valores, setValores] = useState<Record<string, string>>({});
  const [erroHorario, setErroHorario] = useState('');

  const mutation = useMutation({
    mutationFn: async () =>
      api.post(
        `/empresas/${empresaId}/ordens-servico/${ordemServicoId}/itens/${item.id}/relatorio`,
        {
          horaInicio: new Date(horaInicio).toISOString(),
          horaFim: new Date(horaFim).toISOString(),
          observacoes: observacoes || undefined,
          fotos: fotosTexto
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean),
          valores: Object.entries(valores).map(([campoId, valor]) => ({ campoId, valor })),
        },
      ),
    onSuccess: onSalvo,
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (new Date(horaFim) <= new Date(horaInicio)) {
      setErroHorario('O horário de fim precisa ser depois do início');
      return;
    }
    setErroHorario('');
    mutation.mutate();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 flex flex-col gap-4 border-t border-border pt-4"
    >
      <p className="text-sm font-medium text-text">Registrar {texto.min(termos.ordem)}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">Início</label>
          <input
            type="datetime-local"
            required
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">Fim</label>
          <input
            type="datetime-local"
            required
            value={horaFim}
            onChange={(e) => setHoraFim(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
          />
        </div>
      </div>

      {item.servico.camposRelatorio.map((campo) => (
        <div key={campo.id}>
          {campo.tipo === 'CHECKBOX' ? (
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                checked={valores[campo.id] === 'true'}
                onChange={(e) =>
                  setValores((v) => ({ ...v, [campo.id]: String(e.target.checked) }))
                }
                className="h-4 w-4 rounded border-border accent-primary"
              />
              {campo.rotulo}
              {campo.obrigatorio && <span className="text-status-cancelado-text">*</span>}
            </label>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text">
                {campo.rotulo}
                {campo.obrigatorio && <span className="text-status-cancelado-text"> *</span>}
              </label>
              {campo.tipo === 'TEXTO_LONGO' ? (
                <textarea
                  required={campo.obrigatorio}
                  value={valores[campo.id] ?? ''}
                  onChange={(e) => setValores((v) => ({ ...v, [campo.id]: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
                />
              ) : (
                <input
                  required={campo.obrigatorio}
                  value={valores[campo.id] ?? ''}
                  onChange={(e) => setValores((v) => ({ ...v, [campo.id]: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
                />
              )}
            </div>
          )}
        </div>
      ))}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text">
          Observações gerais
        </label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text">
          Fotos (uma URL por linha, opcional)
        </label>
        <textarea
          value={fotosTexto}
          onChange={(e) => setFotosTexto(e.target.value)}
          rows={2}
          placeholder="https://..."
          className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
        />
      </div>

      <Button type="submit" loading={mutation.isPending}>
        Finalizar {texto.min(termos.ordem)}
      </Button>
      {erroHorario && (
        <p className="text-sm text-status-cancelado-text">{erroHorario}</p>
      )}
      {mutation.isError && (
        <p className="text-sm text-status-cancelado-text">
          Verifique os campos obrigatórios e tente de novo.
        </p>
      )}
    </form>
  );
}
