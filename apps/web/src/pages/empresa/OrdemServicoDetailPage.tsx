import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ArrowLeft, Check, CheckCircle2, Clock, ImageOff, Minus, Play, Undo2, X } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { hora, resumoServicos } from '../../components/AgendaLista';
import { FotoAssistido, ListasBriefing } from '../../components/Assistido';
import { FotosUpload } from '../../components/FotosUpload';
import {
  descricaoRecebimento,
  FormRecebimento,
  situacao,
  SituacaoBadge,
  useDesfazerRecebimento,
} from '../../components/Recebimento';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { api } from '../../lib/api';
import { formatarMoeda } from '../../lib/format';
import { acaoDoFuncionario, horarioPassou } from '../../lib/ordens';
import { configSegmento, resumoDados, texto } from '../../lib/segmentos';
import type { OrdemServico, OrdemServicoItem, StatusOS } from '../../types';
import type { EmpresaOutletContext } from './EmpresaLayout';

type Termos = EmpresaOutletContext['termos'];

function paraDatetimeLocal(iso: string) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function duracaoMinutos(inicio: string, fim: string) {
  return Math.round((new Date(fim).getTime() - new Date(inicio).getTime()) / 60000);
}

function dataLonga(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso));
}

export function OrdemServicoDetailPage() {
  const { empresaId, papel, vinculoId, termos, segmento } = useOutletContext<EmpresaOutletContext>();
  const configAssistido = configSegmento(segmento).assistido;
  const { ordemServicoId } = useParams<{ ordemServicoId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const concluidoNaUrl = searchParams.get('concluido') === '1';
  const [jaConcluidoClicado, setJaConcluidoClicado] = useState(false);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);

  const { data: os, isLoading } = useQuery({
    queryKey: ['ordem-servico', ordemServicoId],
    queryFn: async () =>
      (await api.get<OrdemServico>(`/empresas/${empresaId}/ordens-servico/${ordemServicoId}`)).data,
  });

  const mudarStatus = useMutation({
    mutationFn: async (status: StatusOS) =>
      api.patch(`/empresas/${empresaId}/ordens-servico/${ordemServicoId}/status`, { status }),
    onSuccess: () => {
      setConfirmandoCancelar(false);
      queryClient.invalidateQueries({ queryKey: ['ordem-servico', ordemServicoId] });
      queryClient.invalidateQueries({ queryKey: ['ordens-servico', empresaId] });
    },
  });

  if (isLoading || !os) {
    return (
      <div className="flex flex-col gap-4" aria-busy>
        <div className="h-4 w-20 animate-pulse rounded bg-surface" />
        <div className="h-7 w-2/3 animate-pulse rounded bg-surface" />
        <div className="h-48 animate-pulse rounded-xl bg-surface" />
      </div>
    );
  }

  const acao = papel === 'EXECUTOR' ? acaoDoFuncionario(os, vinculoId) : null;
  // "Já concluído" vem da lista (?concluido=1) ou do botão aqui na página
  const modoConcluido = os.status === 'AGENDADO' && horarioPassou(os) && (concluidoNaUrl || jaConcluidoClicado);
  const podeCancelar =
    (papel === 'ADMIN' && ['AGENDADO', 'EXECUTANDO', 'PENDENTE_CLIENTE', 'PENDENTE_EXECUTOR'].includes(os.status)) ||
    (papel === 'EXECUTOR' && os.status === 'EXECUTANDO') ||
    (papel === 'CLIENTE' && os.status === 'AGENDADO');
  const feitos = os.itens.filter((i) => i.relatorio).length;

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['ordem-servico', ordemServicoId] });
    queryClient.invalidateQueries({ queryKey: ['ordens-servico', empresaId] });
  };

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft size={15} />
        Voltar
      </button>

      {/* Cabeçalho */}
      <header className="-mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-text sm:text-2xl">{resumoServicos(os)}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-text-muted">
            <Clock size={14} />
            <span className="first-letter:uppercase">{dataLonga(os.dataAgendada)}</span>
            <span className="text-text-subtle">·</span>
            <span className="num font-semibold text-text">
              {hora(os.dataAgendada)}
            </span>
            <StatusBadge status={os.status} />
            {os.itens.length > 1 && (
              <span className="num text-[13px] text-text-muted">
                {feitos} de {os.itens.length} relatórios
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 empty:hidden">
          {papel === 'ADMIN' && os.status === 'AGENDADO' && (
            <Button variant="secondary" loading={mudarStatus.isPending} onClick={() => mudarStatus.mutate('EXECUTANDO')}>
              <Play size={14} />
              Marcar em andamento
            </Button>
          )}
          {acao === 'iniciar' && (
            <Button tamanho="lg" className="w-full sm:w-auto" loading={mudarStatus.isPending} onClick={() => mudarStatus.mutate('EXECUTANDO')}>
              <Play size={16} fill="currentColor" />
              Iniciar {texto.min(termos.ordem)}
            </Button>
          )}
        </div>
      </header>

      <PedidoPendente
        os={os}
        papel={papel}
        termos={termos}
        enviando={mudarStatus.isPending ? mudarStatus.variables : null}
        erro={mudarStatus.isError ? mensagemDeErro(mudarStatus.error) : null}
        onResponder={(status) => mudarStatus.mutate(status)}
      />

      {acao === 'ja-concluido' && !modoConcluido && (
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-muted">
            O horário marcado já passou. Se você já fez {texto.esse(termos.ordem)}, registre o relatório.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setJaConcluidoClicado(true)}>
              <CheckCircle2 size={15} />
              {termos.ordem.singular} já {texto.concluido(termos.ordem)}
            </Button>
            <Button variant="secondary" loading={mudarStatus.isPending} onClick={() => mudarStatus.mutate('EXECUTANDO')}>
              <Play size={14} />
              Iniciar agora
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Itens e relatórios */}
        <div className="flex min-w-0 flex-col gap-4">
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
              modoConcluido={modoConcluido}
              dataAgendada={os.dataAgendada}
              onAtualizado={invalidar}
            />
          ))}

          {podeCancelar && (
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              {confirmandoCancelar ? (
                <>
                  <span className="text-sm text-text-muted">Cancelar {texto.esse(termos.ordem)}?</span>
                  <Button variant="ghost" onClick={() => setConfirmandoCancelar(false)}>
                    Não
                  </Button>
                  <Button variant="danger" loading={mudarStatus.isPending} onClick={() => mudarStatus.mutate('CANCELADO')}>
                    Sim, cancelar
                  </Button>
                </>
              ) : (
                <Button variant="ghost" className="text-text-subtle hover:text-danger" onClick={() => setConfirmandoCancelar(true)}>
                  Cancelar {texto.min(termos.ordem)}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Detalhes e briefing: no celular aparecem antes dos itens */}
        <aside className="order-first flex flex-col gap-4 lg:order-none">
          {os.assistido && configAssistido && (
            <section className="overflow-hidden rounded-xl border border-border bg-panel shadow-card">
              <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
                <FotoAssistido assistido={os.assistido} config={configAssistido} tamanho={44} />
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-text">{os.assistido.nome}</p>
                  {resumoDados(os.assistido.dados, configAssistido) && (
                    <p className="text-[13px] leading-snug text-text-muted">
                      {resumoDados(os.assistido.dados, configAssistido)}
                    </p>
                  )}
                </div>
              </div>
              <div className="px-4 py-4">
                <ListasBriefing assistido={os.assistido} compacto />
                {!os.assistido.informacoes.length && !os.assistido.lembretes.length && (
                  <p className="text-[13px] text-text-subtle">Sem briefing cadastrado.</p>
                )}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-border bg-panel shadow-card">
            <dl className="divide-y divide-border text-sm">
              {papel !== 'CLIENTE' && (
                <Linha rotulo={termos.cliente.singular}>{os.vinculoCliente.user.nome}</Linha>
              )}
              <Linha rotulo={os.itens.length > 1 ? termos.executor.plural : termos.executor.singular}>
                {[...new Set(os.itens.map((i) => i.vinculoExecutor.user.nome))].join(', ')}
              </Linha>
              <Linha rotulo="Total">
                <span className="num font-semibold">{formatarMoeda(os.valorTotal)}</span>
              </Linha>
              {os.observacoes && <Linha rotulo="Observações">{os.observacoes}</Linha>}
            </dl>
          </section>

          {papel === 'ADMIN' && <Pagamento os={os} empresaId={empresaId} />}
        </aside>
      </div>
    </div>
  );
}

function mensagemDeErro(erro: unknown) {
  const msg = isAxiosError(erro) ? erro.response?.data?.message : null;
  if (Array.isArray(msg)) return msg[0];
  if (typeof msg === 'string') return msg;
  return 'Não foi possível salvar. Tente de novo.';
}

// Pedido que ainda falta alguém aceitar: o cliente pediu (falta o passeador)
// ou o passeador agendou (falta o cliente). Quem precisa responder vê Aceitar e Recusar;
// quem pediu vê que está aguardando e pode desistir.
function PedidoPendente({
  os,
  papel,
  termos,
  enviando,
  erro,
  onResponder,
}: {
  os: OrdemServico;
  papel: string;
  termos: Termos;
  enviando: StatusOS | null | undefined;
  erro: string | null;
  onResponder: (status: StatusOS) => void;
}) {
  if (os.status !== 'PENDENTE_CLIENTE' && os.status !== 'PENDENTE_EXECUTOR') return null;

  const faltaCliente = os.status === 'PENDENTE_CLIENTE';
  const passeador = os.itens[0]?.vinculoExecutor.user.nome.split(' ')[0] ?? texto.min(termos.executor);
  const cliente = os.vinculoCliente.user.nome.split(' ')[0];
  const devoResponder = (faltaCliente && papel === 'CLIENTE') || (!faltaCliente && papel === 'EXECUTOR');
  const fuiEuQuePedi = (faltaCliente && papel === 'EXECUTOR') || (!faltaCliente && papel === 'CLIENTE');

  let titulo: string;
  let descricao: string;
  if (devoResponder) {
    titulo = faltaCliente ? `${passeador} agendou ${texto.esse(termos.ordem)}` : `${cliente} pediu ${texto.esse(termos.ordem)}`;
    descricao = faltaCliente
      ? 'Confira o dia e o horário. Só fica confirmado depois que você aceitar.'
      : 'Confira se você consegue nesse dia e horário. Só fica confirmado depois que você aceitar.';
  } else {
    titulo = faltaCliente ? `Aguardando ${cliente} aceitar` : `Aguardando ${passeador} aceitar`;
    descricao = fuiEuQuePedi
      ? 'Você recebe a resposta aqui. Enquanto isso, o horário fica reservado.'
      : 'Esse pedido ainda não foi confirmado pelos dois lados.';
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-dashed border-primary/60 bg-primary-soft/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-text">{titulo}</p>
        <p className="mt-0.5 text-sm text-text-muted">{descricao}</p>
        {erro && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {erro}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {devoResponder && (
          <>
            <Button variant="secondary" loading={enviando === 'RECUSADO'} onClick={() => onResponder('RECUSADO')}>
              <X size={15} />
              Recusar
            </Button>
            <Button loading={enviando === 'AGENDADO'} onClick={() => onResponder('AGENDADO')}>
              <Check size={15} strokeWidth={2.5} />
              Aceitar
            </Button>
          </>
        )}
        {fuiEuQuePedi && (
          <Button
            variant="ghost"
            className="text-text-subtle hover:text-danger"
            loading={enviando === 'CANCELADO'}
            onClick={() => onResponder('CANCELADO')}
          >
            {faltaCliente ? 'Cancelar agendamento' : 'Desistir do pedido'}
          </Button>
        )}
      </div>
    </section>
  );
}

// Financeiro do atendimento (só o administrador vê e registra)
function Pagamento({ os, empresaId }: { os: OrdemServico; empresaId: string }) {
  const [registrando, setRegistrando] = useState(false);
  const desfazer = useDesfazerRecebimento(empresaId, os);
  const s = situacao(os);
  if (s === 'cancelado') return null;

  return (
    <section className="rounded-xl border border-border bg-panel shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-text">Pagamento</h2>
        <SituacaoBadge valor={s} />
      </div>
      <div className="px-4 py-4">
        {s === 'recebido' ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-text-muted">Recebido em {descricaoRecebimento(os)}</p>
            <Button
              variant="ghost"
              tamanho="sm"
              className="text-text-subtle"
              loading={desfazer.isPending}
              onClick={() => desfazer.mutate()}
            >
              {!desfazer.isPending && <Undo2 size={14} />}
              Desfazer
            </Button>
          </div>
        ) : registrando ? (
          <FormRecebimento os={os} empresaId={empresaId} onFechar={() => setRegistrando(false)} />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-text-muted">
              {s === 'receber'
                ? 'Concluído e ainda não pago.'
                : 'Ainda não aconteceu. Se o cliente pagou adiantado, registre aqui.'}
            </p>
            <Button variant="secondary" className="w-full" onClick={() => setRegistrando(true)}>
              <Check size={15} strokeWidth={2.5} />
              Marcar como recebido
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-text-muted">{rotulo}</dt>
      <dd className="min-w-0 text-right text-text">{children}</dd>
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
  modoConcluido,
  dataAgendada,
  onAtualizado,
}: {
  termos: Termos;
  item: OrdemServicoItem;
  osStatus: StatusOS;
  empresaId: string;
  ordemServicoId: string;
  papel: string;
  souExecutorDoItem: boolean;
  // Funcionário clicou em "já concluído" (horário passou e ele não iniciou)
  modoConcluido: boolean;
  dataAgendada: string;
  onAtualizado: () => void;
}) {
  const podePreencher =
    papel === 'EXECUTOR' &&
    souExecutorDoItem &&
    !item.relatorio &&
    (osStatus === 'EXECUTANDO' || (osStatus === 'AGENDADO' && modoConcluido));

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-panel shadow-card">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar nome={item.vinculoExecutor.user.nome} size={32} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-text">{item.servico.nome}</p>
            <p className="truncate text-[13px] text-text-muted">{item.vinculoExecutor.user.nome}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {item.relatorio && (
            <span className="hidden items-center gap-1.5 text-[13px] text-text-muted sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-ok" />
              Relatório enviado
            </span>
          )}
          <p className="num font-medium text-text">{formatarMoeda(item.valor)}</p>
        </div>
      </div>

      {item.relatorio ? (
        <RelatorioLeitura item={item} />
      ) : podePreencher ? (
        <RelatorioForm
          item={item}
          empresaId={empresaId}
          termos={termos}
          ordemServicoId={ordemServicoId}
          inicioSugerido={osStatus === 'AGENDADO' ? dataAgendada : undefined}
          onSalvo={onAtualizado}
        />
      ) : (
        <p className="border-t border-border bg-surface/50 px-5 py-3.5 text-[13px] text-text-muted">
          {osStatus === 'AGENDADO'
            ? `O relatório fica disponível quando ${texto.o(termos.ordem)} começar.`
            : osStatus === 'CANCELADO'
              ? `${termos.ordem.singular} cancelad${termos.ordem.feminino ? 'a' : 'o'}.`
              : `Aguardando o relatório de ${item.vinculoExecutor.user.nome.split(' ')[0]}.`}
        </p>
      )}
    </section>
  );
}

function RelatorioLeitura({ item }: { item: OrdemServicoItem }) {
  const relatorio = item.relatorio!;
  const checks = item.servico.camposRelatorio.filter((c) => c.tipo === 'CHECKBOX');
  const textos = item.servico.camposRelatorio.filter((c) => c.tipo !== 'CHECKBOX');
  const valorDe = (id: string) => relatorio.valores.find((v) => v.campoId === id)?.valor;

  return (
    <div className="flex flex-col gap-5 border-t border-border px-5 py-5">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-surface px-4 py-3">
          <p className="text-xs text-text-muted">Horário</p>
          <p className="num mt-0.5 text-lg font-semibold text-text">
            {hora(relatorio.horaInicio)} – {hora(relatorio.horaFim)}
          </p>
        </div>
        <div className="rounded-lg bg-surface px-4 py-3">
          <p className="text-xs text-text-muted">Duração</p>
          <p className="num mt-0.5 text-lg font-semibold text-text">
            {duracaoMinutos(relatorio.horaInicio, relatorio.horaFim)} min
          </p>
        </div>
      </div>

      {!!checks.length && (
        <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {checks.map((campo) => {
            const sim = valorDe(campo.id) === 'true';
            return (
              <li key={campo.id} className="flex items-center gap-2.5 text-sm">
                <span
                  className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded ${
                    sim ? 'bg-primary text-white' : 'border border-border-strong text-text-subtle'
                  }`}
                >
                  {sim ? <Check size={12} strokeWidth={3} /> : <Minus size={12} />}
                </span>
                <span className={sim ? 'text-text' : 'text-text-muted'}>{campo.rotulo}</span>
              </li>
            );
          })}
        </ul>
      )}

      {textos.map((campo) => (
        <div key={campo.id} className="text-sm">
          <p className="mb-0.5 text-xs text-text-muted">{campo.rotulo}</p>
          <p className="whitespace-pre-line text-text">{valorDe(campo.id) || '—'}</p>
        </div>
      ))}

      {relatorio.observacoes && (
        <blockquote className="rounded-lg border border-border bg-surface/60 px-4 py-3 text-sm leading-relaxed text-text">
          {relatorio.observacoes}
        </blockquote>
      )}

      {relatorio.fotos.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto">
          {relatorio.fotos.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="shrink-0">
              <img src={url} alt="Foto do relatório" className="h-24 w-24 rounded-lg border border-border object-cover" />
            </a>
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-2 text-xs text-text-subtle">
          <ImageOff size={14} />
          Nenhuma foto anexada
        </p>
      )}
    </div>
  );
}

function RelatorioForm({
  item,
  empresaId,
  ordemServicoId,
  termos,
  inicioSugerido,
  onSalvo,
}: {
  termos: Termos;
  item: OrdemServicoItem;
  empresaId: string;
  ordemServicoId: string;
  // "Já concluído": sugere o horário marcado como início e 30 min depois como fim
  inicioSugerido?: string;
  onSalvo: () => void;
}) {
  const agora = paraDatetimeLocal(new Date().toISOString());
  const [horaInicio, setHoraInicio] = useState(inicioSugerido ? paraDatetimeLocal(inicioSugerido) : agora);
  const [horaFim, setHoraFim] = useState(
    inicioSugerido
      ? paraDatetimeLocal(new Date(new Date(inicioSugerido).getTime() + 30 * 60000).toISOString())
      : agora,
  );
  const [observacoes, setObservacoes] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [erroHorario, setErroHorario] = useState('');

  const mutation = useMutation({
    mutationFn: async () =>
      api.post(`/empresas/${empresaId}/ordens-servico/${ordemServicoId}/itens/${item.id}/relatorio`, {
        horaInicio: new Date(horaInicio).toISOString(),
        horaFim: new Date(horaFim).toISOString(),
        observacoes: observacoes || undefined,
        fotos,
        valores: Object.entries(valores).map(([campoId, valor]) => ({ campoId, valor })),
      }),
    onSuccess: onSalvo,
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (new Date(horaFim) <= new Date(horaInicio)) {
      setErroHorario('O horário de fim precisa ser depois do início.');
      return;
    }
    setErroHorario('');
    mutation.mutate();
  }

  const checks = item.servico.camposRelatorio.filter((c) => c.tipo === 'CHECKBOX');
  const textos = item.servico.camposRelatorio.filter((c) => c.tipo !== 'CHECKBOX');

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 border-t border-border bg-surface/40 px-5 py-5">
      <p className="text-sm font-semibold text-text">
        {inicioSugerido
          ? `Registrar ${texto.min(termos.ordem)} já ${texto.concluido(termos.ordem)}`
          : `Relatório ${texto.doDa(termos.ordem)}`}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`ini-${item.id}`} className="rotulo">
            Início
          </label>
          <input
            id={`ini-${item.id}`}
            type="datetime-local"
            required
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className="campo"
          />
        </div>
        <div>
          <label htmlFor={`fim-${item.id}`} className="rotulo">
            Fim
          </label>
          <input
            id={`fim-${item.id}`}
            type="datetime-local"
            required
            value={horaFim}
            onChange={(e) => setHoraFim(e.target.value)}
            className="campo"
          />
        </div>
      </div>

      {!!checks.length && (
        <fieldset>
          <legend className="rotulo">Checklist</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {checks.map((campo) => {
              const marcado = valores[campo.id] === 'true';
              return (
                <label
                  key={campo.id}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition-colors ${
                    marcado ? 'border-primary bg-primary-soft/40 text-text' : 'border-border bg-panel text-text-muted hover:border-border-strong'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={(e) => setValores((v) => ({ ...v, [campo.id]: String(e.target.checked) }))}
                    className="peer sr-only"
                  />
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary ${
                      marcado ? 'bg-primary text-white' : 'border border-border-strong'
                    }`}
                  >
                    {marcado && <Check size={13} strokeWidth={3} />}
                  </span>
                  <span className="flex-1">{campo.rotulo}</span>
                  {campo.obrigatorio && <span className="text-xs text-text-subtle">obrigatório</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {textos.map((campo) => (
        <div key={campo.id}>
          <label htmlFor={`c-${campo.id}`} className="rotulo">
            {campo.rotulo}
            {campo.obrigatorio && <span className="ml-1 font-normal text-text-subtle">(obrigatório)</span>}
          </label>
          {campo.tipo === 'TEXTO_LONGO' ? (
            <textarea
              id={`c-${campo.id}`}
              required={campo.obrigatorio}
              value={valores[campo.id] ?? ''}
              onChange={(e) => setValores((v) => ({ ...v, [campo.id]: e.target.value }))}
              rows={3}
              className="campo"
            />
          ) : (
            <input
              id={`c-${campo.id}`}
              required={campo.obrigatorio}
              value={valores[campo.id] ?? ''}
              onChange={(e) => setValores((v) => ({ ...v, [campo.id]: e.target.value }))}
              className="campo"
            />
          )}
        </div>
      ))}

      <div>
        <label htmlFor={`obs-${item.id}`} className="rotulo">
          Observações
        </label>
        <textarea
          id={`obs-${item.id}`}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={2}
          placeholder="Como foi? Algo que o cliente precisa saber?"
          className="campo"
        />
      </div>

      <FotosUpload valor={fotos} onChange={setFotos} />

      {(erroHorario || mutation.isError) && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-danger">
          <X size={14} />
          {erroHorario || 'Confira os campos obrigatórios e tente de novo.'}
        </p>
      )}

      <Button type="submit" tamanho="lg" loading={mutation.isPending} className="w-full sm:w-auto sm:self-end">
        <CheckCircle2 size={16} />
        Finalizar {texto.min(termos.ordem)}
      </Button>
    </form>
  );
}
