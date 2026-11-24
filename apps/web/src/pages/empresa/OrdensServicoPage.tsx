import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  MessageSquareReply,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import type { AxiosError } from 'axios';
import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { AgendaLista, hora, resumoServicos, rotuloDia } from '../../components/AgendaLista';
import { ListasBriefing } from '../../components/Assistido';
import { StatusBadge } from '../../components/ui/Badge';
import { Button, IconButton } from '../../components/ui/Button';
import { PageHeader, Skeleton } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { formatarMoeda } from '../../lib/format';
import { acaoDoFuncionario, type AcaoFuncionario } from '../../lib/ordens';
import { configSegmento, texto } from '../../lib/segmentos';
import type { Assistido, Membro, OrdemServico, Servico } from '../../types';
import type { EmpresaOutletContext } from './EmpresaLayout';

type Termos = EmpresaOutletContext['termos'];
type Aba = 'proximos' | 'anteriores';

// Mensagem de erro que a API devolveu (ex.: "Você só pode agendar para os seus clientes")
function mensagemErro(erro: unknown) {
  const message = (erro as AxiosError<{ message?: string | string[] }> | null)?.response?.data?.message;
  return Array.isArray(message) ? message[0] : message;
}

// Preço do serviço com esse passeador: o preço próprio dele (aprovado pelo admin) ou o do catálogo
function precoDe(servico: Servico, vinculoExecutorId: string) {
  return Number(servico.executores.find((e) => e.vinculoExecutorId === vinculoExecutorId)?.valor ?? servico.valor);
}

// Ainda vai acontecer: confirmado, em andamento ou pedido aguardando resposta
const ativa = (os: OrdemServico) =>
  ['PENDENTE_EXECUTOR', 'PENDENTE_CLIENTE', 'AGENDADO', 'EXECUTANDO'].includes(os.status);
const tempo = (os: OrdemServico) => new Date(os.dataAgendada).getTime();

export function OrdensServicoPage() {
  const { empresaId, papel, termos, vinculoId } = useOutletContext<EmpresaOutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const formAberto = searchParams.get('novo') === '1';
  const [aba, setAba] = useState<Aba>('proximos');

  function abrirForm(aberto: boolean) {
    const p = new URLSearchParams(searchParams);
    if (aberto) p.set('novo', '1');
    else p.delete('novo');
    setSearchParams(p, { replace: true });
  }

  const { data: ordens, isLoading } = useQuery({
    queryKey: ['ordens-servico', empresaId],
    queryFn: async () => (await api.get<OrdemServico[]>(`/empresas/${empresaId}/ordens-servico`)).data,
  });

  const iniciar = useMutation({
    mutationFn: async (id: string) =>
      api.patch(`/empresas/${empresaId}/ordens-servico/${id}/status`, { status: 'EXECUTANDO' }),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico', empresaId] });
      navigate(id);
    },
  });

  if (papel === 'CLIENTE') {
    return (
      <>
        <HistoricoCliente
          termos={termos}
          ordens={ordens ?? []}
          carregando={isLoading}
          onAbrir={(id) => navigate(id)}
          onPedir={() => abrirForm(true)}
        />
        <NovaOsModal open={formAberto} empresaId={empresaId} termos={termos} onClose={() => abrirForm(false)} />
      </>
    );
  }

  const podeCriar = papel === 'ADMIN' || papel === 'EXECUTOR';
  const souFuncionario = papel === 'EXECUTOR';

  const proximas = (ordens ?? []).filter(ativa).sort((a, b) => tempo(a) - tempo(b));
  const anteriores = (ordens ?? []).filter((os) => !ativa(os)).sort((a, b) => tempo(b) - tempo(a));
  const visiveis = aba === 'proximos' ? proximas : anteriores;

  // Para o funcionário: o próximo atendimento em que ele tem algo a fazer, em destaque
  const foco = souFuncionario ? proximas.find((os) => acaoDoFuncionario(os, vinculoId)) : undefined;

  function botaoAcao(os: OrdemServico, acao: AcaoFuncionario, grande = false) {
    const tamanho = grande ? 'lg' : 'sm';
    if (acao === 'responder')
      return (
        <Button tamanho={tamanho} className={grande ? 'w-full sm:w-auto' : ''} onClick={() => navigate(os.id)}>
          <MessageSquareReply size={grande ? 16 : 14} />
          Responder pedido
        </Button>
      );
    if (acao === 'iniciar')
      return (
        <Button
          tamanho={tamanho}
          className={grande ? 'w-full sm:w-auto' : ''}
          loading={iniciar.isPending && iniciar.variables === os.id}
          onClick={() => iniciar.mutate(os.id)}
        >
          <Play size={grande ? 16 : 14} fill="currentColor" />
          Iniciar {texto.min(termos.ordem)}
        </Button>
      );
    if (acao === 'ja-concluido')
      return (
        <Button
          tamanho={tamanho}
          variant={grande ? 'primary' : 'secondary'}
          className={grande ? 'w-full sm:w-auto' : ''}
          onClick={() => navigate(`${os.id}?concluido=1`)}
        >
          <CheckCircle2 size={grande ? 16 : 14} />
          {termos.ordem.singular} já {texto.concluido(termos.ordem)}
        </Button>
      );
    if (acao === 'registrar')
      return (
        <Button tamanho={tamanho} className={grande ? 'w-full sm:w-auto' : ''} onClick={() => navigate(os.id)}>
          <ClipboardList size={grande ? 16 : 14} />
          Registrar relatório
        </Button>
      );
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo={termos.ordem.plural}
        descricao={
          papel === 'ADMIN'
            ? `${texto.todos(termos.ordem)} da empresa, por dia e horário`
            : `${termos.ordem.plural} em que você está designado`
        }
        acoes={
          podeCriar && (
            <Button onClick={() => abrirForm(true)}>
              <Plus size={16} />
              {texto.novo(termos.ordem)}
            </Button>
          )
        }
      />

      {foco && <ProximoFoco os={foco} termos={termos} acao={botaoAcao(foco, acaoDoFuncionario(foco, vinculoId), true)} onAbrir={() => navigate(foco.id)} />}

      {isLoading ? (
        <Skeleton linhas={5} />
      ) : !ordens?.length ? (
        <EmptyState
          icon={CalendarClock}
          title={`${texto.nenhum(termos.ordem)} ainda`}
          description={`Quando ${texto.um(termos.ordem)} for ${texto.agendado(termos.ordem)}, aparece aqui, organizado por dia.`}
          action={
            podeCriar ? (
              <Button variant="secondary" onClick={() => abrirForm(true)}>
                <Plus size={15} />
                {texto.novo(termos.ordem)}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <section>
          <Abas
            aba={aba}
            onAba={setAba}
            itens={[
              ['proximos', 'Próximos', proximas.length],
              ['anteriores', 'Encerrados', anteriores.length],
            ]}
          />

          {visiveis.length ? (
            <AgendaLista
              ordens={visiveis}
              onAbrir={(id) => navigate(id)}
              mostrarExecutor={!souFuncionario}
              linhaAgora={aba === 'proximos'}
              acao={
                souFuncionario
                  ? (os) => (os.id === foco?.id ? null : botaoAcao(os, acaoDoFuncionario(os, vinculoId)))
                  : undefined
              }
            />
          ) : (
            <p className="rounded-xl border border-dashed border-border-strong px-5 py-8 text-center text-sm text-text-muted">
              {aba === 'proximos'
                ? `${texto.nenhum(termos.ordem)} ${texto.agendado(termos.ordem)} daqui para frente.`
                : `${texto.nenhum(termos.ordem)} ${texto.concluido(termos.ordem)} ou cancelado ainda.`}
            </p>
          )}
        </section>
      )}

      {podeCriar && (
        <NovaOsModal open={formAberto} empresaId={empresaId} termos={termos} onClose={() => abrirForm(false)} />
      )}
    </div>
  );
}

// O próximo atendimento do funcionário: horário grande, briefing e uma única ação
function ProximoFoco({
  os,
  termos,
  acao,
  onAbrir,
}: {
  os: OrdemServico;
  termos: Termos;
  acao: ReactNode;
  onAbrir: () => void;
}) {
  const andamento = os.status === 'EXECUTANDO';
  return (
    <section className="overflow-hidden rounded-xl border border-primary-line bg-panel shadow-card">
      <div className="flex flex-col sm:flex-row">
        <PlacaHorario
          rotulo={andamento ? 'Agora' : rotuloDia(os.dataAgendada)}
          horario={hora(os.dataAgendada)}
          andamento={andamento}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
          <div className="min-w-0 flex-1">
            <button onClick={onAbrir} className="group block max-w-full text-left" aria-label={`${andamento ? `${termos.ordem.singular} em andamento` : texto.proximo(termos.ordem)}: ${resumoServicos(os)}`}>
              <span className="block text-lg font-semibold leading-snug text-text group-hover:text-primary-text">
                {resumoServicos(os)}
              </span>
            </button>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-muted">
              <span className="truncate">{os.vinculoCliente.user.nome}</span>
              <StatusBadge status={os.status} />
            </p>
          </div>
          <div className="sm:shrink-0">{acao}</div>
        </div>
      </div>
      {os.assistido && (!!os.assistido.informacoes?.length || !!os.assistido.lembretes?.length) && (
        <div className="border-t border-border bg-surface/60 px-4 py-3.5 sm:px-5">
          <ListasBriefing assistido={os.assistido} compacto />
        </div>
      )}
    </section>
  );
}

// Bloco do horário, em destaque
function PlacaHorario({ rotulo, horario, andamento }: { rotulo: string; horario: string; andamento: boolean }) {
  return (
    <div className="relative flex items-center gap-3 bg-primary-soft px-4 py-3 text-primary-text sm:w-[140px] sm:flex-col sm:items-start sm:justify-center sm:gap-1 sm:px-5 sm:py-5">
      <span className="text-xs font-medium first-letter:uppercase">{rotulo}</span>
      <span className="text-[28px] font-semibold leading-none tracking-[-0.02em]">{horario}</span>
      {andamento && (
        <span className="ml-auto h-2.5 w-2.5 animate-[pulso_2s_ease-out_infinite] rounded-full bg-primary sm:absolute sm:right-3 sm:top-3" />
      )}
    </div>
  );
}

function HistoricoCliente({
  termos,
  ordens,
  carregando,
  onAbrir,
  onPedir,
}: {
  termos: Termos;
  ordens: OrdemServico[];
  carregando: boolean;
  onAbrir: (id: string) => void;
  onPedir: () => void;
}) {
  const { responsavel } = useOutletContext<EmpresaOutletContext>();
  const emAndamento = ordens.find((o) => o.status === 'EXECUTANDO');
  const proxima = ordens.filter((o) => o.status === 'AGENDADO').sort((a, b) => tempo(a) - tempo(b))[0];
  const destaque = emAndamento ?? proxima;
  // Agendamentos feitos pelo passeador que o cliente precisa aceitar
  const paraResponder = ordens.filter((o) => o.status === 'PENDENTE_CLIENTE').sort((a, b) => tempo(a) - tempo(b));

  const historico = ordens.filter((o) => o.id !== destaque?.id && o.status !== 'PENDENTE_CLIENTE');
  // Agendados leem para frente (como o percurso); anteriores, do mais recente para trás
  const agendados = historico.filter(ativa).sort((a, b) => tempo(a) - tempo(b));
  const anteriores = historico.filter((o) => !ativa(o)).sort((a, b) => tempo(b) - tempo(a));
  const [aba, setAba] = useState<Aba>(agendados.length || !anteriores.length ? 'proximos' : 'anteriores');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Histórico"
        descricao={`Acompanhe ${texto.os(termos.ordem)}, leia os relatórios e peça ${texto.um(termos.ordem)} novo`}
        acoes={
          responsavel && (
            <Button onClick={onPedir}>
              <Plus size={16} />
              Pedir {texto.min(termos.ordem)}
            </Button>
          )
        }
      />

      {!responsavel && (
        <p className="rounded-xl border border-dashed border-border-strong px-4 py-3 text-[13px] text-text-muted">
          Para pedir {texto.um(termos.ordem)}, a empresa precisa definir {texto.o(termos.executor)} que atende você.
        </p>
      )}

      {paraResponder.length > 0 && (
        <section>
          <p className="mb-2 text-sm font-semibold text-text">
            {paraResponder.length === 1 ? 'Um agendamento' : `${paraResponder.length} agendamentos`} para você aceitar
          </p>
          <AgendaLista
            ordens={paraResponder}
            onAbrir={onAbrir}
            mostrarCliente={false}
            linhaAgora={false}
            acao={(os) => (
              <Button tamanho="sm" onClick={() => onAbrir(os.id)}>
                <MessageSquareReply size={14} />
                Responder
              </Button>
            )}
          />
        </section>
      )}

      {destaque && (
        <button
          onClick={() => onAbrir(destaque.id)}
          className="group flex w-full flex-col overflow-hidden rounded-xl border border-primary-line bg-panel text-left shadow-card transition-colors hover:bg-primary-soft/30 sm:flex-row"
        >
          <PlacaHorario
            rotulo={destaque.status === 'EXECUTANDO' ? 'Agora' : rotuloDia(destaque.dataAgendada)}
            horario={hora(destaque.dataAgendada)}
            andamento={destaque.status === 'EXECUTANDO'}
          />
          <div className="flex min-w-0 flex-1 items-center gap-4 p-4 sm:p-5">
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold leading-snug text-text">
                {resumoServicos(destaque)}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2">
                <span className="num text-sm text-text-muted">
                  {formatarMoeda(destaque.valorTotal)}
                </span>
                <StatusBadge status={destaque.status} />
              </p>
            </div>
            <ArrowRight
              size={18}
              className="shrink-0 text-text-subtle transition-transform group-hover:translate-x-0.5"
            />
          </div>
        </button>
      )}

      <section>
        {carregando ? (
          <Skeleton linhas={4} />
        ) : !historico.length ? (
          <EmptyState
            icon={CalendarClock}
            title="Nada por aqui ainda"
            description={`${texto.seus(termos.ordem)} ${texto.concluidos(termos.ordem)} e os relatórios aparecem nesta lista.`}
          />
        ) : (
          <>
            <Abas
              aba={aba}
              onAba={setAba}
              itens={[
                ['proximos', 'Agendados', agendados.length],
                ['anteriores', 'Encerrados', anteriores.length],
              ]}
            />
            {(aba === 'proximos' ? agendados : anteriores).length ? (
              <AgendaLista
                ordens={aba === 'proximos' ? agendados : anteriores}
                onAbrir={onAbrir}
                mostrarCliente={false}
                linhaAgora={aba === 'proximos'}
              />
            ) : (
              <p className="rounded-xl border border-dashed border-border-strong px-5 py-8 text-center text-sm text-text-muted">
                {aba === 'proximos'
                  ? `${texto.nenhum(termos.ordem)} ${texto.agendado(termos.ordem)} daqui para frente.`
                  : `${texto.nenhum(termos.ordem)} ${texto.concluido(termos.ordem)} ainda.`}
              </p>
            )}
          </>
        )}
      </section>
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
  const { papel, vinculoId, segmento, responsavel } = useOutletContext<EmpresaOutletContext>();
  const configAssistido = configSegmento(segmento).assistido;
  const souFuncionario = papel === 'EXECUTOR';
  const souCliente = papel === 'CLIENTE';
  // Funcionário agenda para si mesmo; cliente pede ao passeador que o atende
  const executorFixo = souFuncionario ? vinculoId : souCliente ? (responsavel?.vinculoId ?? '') : null;
  const queryClient = useQueryClient();
  const [clienteEscolhido, setVinculoClienteId] = useState('');
  const vinculoClienteId = souCliente ? vinculoId : clienteEscolhido;
  const [assistidoId, setAssistidoId] = useState('');
  const [dataAgendada, setDataAgendada] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const itemVazio = () => ({ servicoId: '', vinculoExecutorId: executorFixo ?? '' });
  const [itens, setItens] = useState(() => [itemVazio()]);

  // Admin vê todos os clientes; funcionário só os clientes pelos quais é responsável
  const { data: clientes } = useQuery({
    queryKey: ['clientes', empresaId],
    queryFn: async () => (await api.get<Membro[]>(`/empresas/${empresaId}/clientes`)).data,
    enabled: open && !souCliente,
  });
  const { data: servicos } = useQuery({
    queryKey: ['servicos', empresaId],
    queryFn: async () => (await api.get<Servico[]>(`/empresas/${empresaId}/servicos`)).data,
    enabled: open,
  });

  // Pets (ou crianças, imóveis...) do cliente escolhido
  const { data: assistidosDoCliente } = useQuery({
    queryKey: ['assistidos', empresaId, vinculoClienteId],
    queryFn: async () =>
      (await api.get<Assistido[]>(`/empresas/${empresaId}/assistidos`, { params: { vinculoClienteId } })).data,
    enabled: open && !!configAssistido && !!vinculoClienteId,
  });

  const cliente = clientes?.find((c) => c.id === vinculoClienteId);
  const responsavelId = cliente?.vinculoResponsavelId ?? '';

  // Funcionário (e o cliente) só veem os serviços que esse passeador faz
  const servicosDisponiveis = (servicos ?? []).filter(
    (s) => s.ativo && s.aprovado && (executorFixo === null || s.executores.some((e) => e.vinculoExecutorId === executorFixo)),
  );

  const total = itens.reduce((soma, item) => {
    const servico = servicos?.find((s) => s.id === item.servicoId);
    return soma + (servico ? precoDe(servico, item.vinculoExecutorId) : 0);
  }, 0);

  // Sugestão de executor: o responsável pelo cliente, se ele faz esse serviço
  function executorPadrao(servicoId: string, responsavel = responsavelId) {
    if (executorFixo !== null) return executorFixo;
    const servico = servicos?.find((s) => s.id === servicoId);
    return servico?.executores.some((e) => e.vinculoExecutorId === responsavel) ? responsavel : '';
  }

  function escolherCliente(id: string) {
    setVinculoClienteId(id);
    setAssistidoId('');
    const novoResponsavel = clientes?.find((c) => c.id === id)?.vinculoResponsavelId ?? '';
    setItens((atual) =>
      atual.map((item) =>
        item.servicoId ? { ...item, vinculoExecutorId: executorPadrao(item.servicoId, novoResponsavel) } : item,
      ),
    );
  }

  const mutation = useMutation({
    mutationFn: async () =>
      api.post(`/empresas/${empresaId}/ordens-servico`, {
        vinculoClienteId: souCliente ? undefined : vinculoClienteId,
        assistidoId: assistidoId || undefined,
        dataAgendada: new Date(dataAgendada).toISOString(),
        observacoes: observacoes || undefined,
        itens,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico', empresaId] });
      onClose();
      setVinculoClienteId('');
      setAssistidoId('');
      setDataAgendada('');
      setObservacoes('');
      setItens([itemVazio()]);
    },
  });

  function atualizarItem(index: number, campo: 'servicoId' | 'vinculoExecutorId', valor: string) {
    setItens((atual) =>
      atual.map((item, i) => {
        if (i !== index) return item;
        if (campo === 'servicoId') return { servicoId: valor, vinculoExecutorId: executorPadrao(valor) };
        return { ...item, vinculoExecutorId: valor };
      }),
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={souCliente ? `Pedir ${texto.min(termos.ordem)}` : texto.novo(termos.ordem)}
      description={
        souCliente
          ? `O pedido vai para ${responsavel?.nome ?? texto.o(termos.executor)}, que confirma se consegue no dia e horário.`
          : souFuncionario
            ? `Você será quem faz. ${termos.cliente.singular} recebe o agendamento e confirma.`
            : undefined
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {!souCliente && (
        <div>
          <label htmlFor="os-cliente" className="rotulo">
            {termos.cliente.singular}
          </label>
          {clientes && !clientes.length ? (
            <p className="rounded-lg bg-surface px-3 py-2.5 text-[13px] text-text-muted">
              {souFuncionario
                ? `Você ainda não tem ${texto.min(termos.cliente, true)}. Peça ao administrador para ligar ${texto.min(termos.cliente, true)} a você.`
                : `Nenhum ${texto.min(termos.cliente)} na empresa ainda. Convide em Equipe.`}
            </p>
          ) : (
            <select
              id="os-cliente"
              required
              value={vinculoClienteId}
              onChange={(e) => escolherCliente(e.target.value)}
              className="campo"
            >
              <option value="">Selecione…</option>
              {clientes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.user.nome}
                  {!souFuncionario && c.responsavel ? ` (${c.responsavel.user.nome})` : ''}
                </option>
              ))}
            </select>
          )}
          {!souFuncionario && cliente && !cliente.responsavel && (
            <p className="mt-1.5 text-xs text-danger">
              Esse {texto.min(termos.cliente)} ainda não tem {texto.min(termos.executor)} responsável. Defina em
              Equipe.
            </p>
          )}
        </div>
        )}

        {configAssistido && vinculoClienteId && assistidosDoCliente && (
          <div>
            <label htmlFor="os-assistido" className="rotulo">
              {configAssistido.termo.singular}
            </label>
            {assistidosDoCliente.length ? (
              <select
                id="os-assistido"
                required
                value={assistidoId}
                onChange={(e) => setAssistidoId(e.target.value)}
                className="campo"
              >
                <option value="">Selecione…</option>
                {assistidosDoCliente.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
            ) : (
              <p className="rounded-lg bg-surface px-3 py-2.5 text-[13px] text-text-muted">
                {souCliente
                  ? `Você ainda não tem ${texto.min(configAssistido.termo)} ${texto.cadastrado(configAssistido.termo)}. Cadastre no menu ${texto.meus(configAssistido.termo)}.`
                  : `Esse cliente ainda não tem ${texto.min(configAssistido.termo)} ${texto.cadastrado(configAssistido.termo)}. ${
                      souFuncionario
                        ? 'Peça ao cliente ou ao administrador para cadastrar.'
                        : `Cadastre no menu ${configAssistido.termo.plural}.`
                    }`}
              </p>
            )}
          </div>
        )}

        <Input
          label="Data e hora"
          name="dataAgendada"
          type="datetime-local"
          required
          value={dataAgendada}
          onChange={(e) => setDataAgendada(e.target.value)}
        />

        <div>
          <p className="rotulo">Serviços</p>
          <div className="overflow-hidden rounded-lg border border-border">
            {itens.map((item, index) => {
              const servico = servicos?.find((s) => s.id === item.servicoId);
              return (
                <div key={index} className="flex items-end gap-2 border-b border-border p-3 last:border-0">
                  <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-text-muted">Serviço</label>
                      <select
                        required
                        value={item.servicoId}
                        onChange={(e) => atualizarItem(index, 'servicoId', e.target.value)}
                        className="campo"
                      >
                        <option value="">Selecione…</option>
                        {servicosDisponiveis.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nome} · {formatarMoeda(precoDe(s, executorFixo ?? item.vinculoExecutorId))}
                          </option>
                        ))}
                      </select>
                    </div>
                    {executorFixo === null && (
                      <div>
                        <label className="mb-1 block text-xs text-text-muted">{termos.executor.singular}</label>
                        <select
                          required
                          disabled={!servico}
                          value={item.vinculoExecutorId}
                          onChange={(e) => atualizarItem(index, 'vinculoExecutorId', e.target.value)}
                          className="campo"
                        >
                          <option value="">Selecione…</option>
                          {servico?.executores.map((ex) => (
                            <option key={ex.vinculoExecutorId} value={ex.vinculoExecutorId}>
                              {ex.nome}
                              {ex.vinculoExecutorId === responsavelId ? ' (responsável)' : ''}
                              {ex.valor ? ` · ${formatarMoeda(ex.valor)}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  {itens.length > 1 && (
                    <IconButton
                      label="Remover serviço"
                      perigo
                      className="mb-0.5"
                      onClick={() => setItens((atual) => atual.filter((_, i) => i !== index))}
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  )}
                </div>
              );
            })}
            <div className="flex items-center justify-between bg-surface/60 px-3 py-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-muted hover:text-text"
                onClick={() => setItens((atual) => [...atual, itemVazio()])}
              >
                <Plus size={14} />
                Adicionar serviço
              </button>
              <span className="num text-[13px] text-text-muted">
                Total <span className="font-semibold text-text">{formatarMoeda(total)}</span>
              </span>
            </div>
          </div>
          {souFuncionario && servicos && !servicosDisponiveis.length && (
            <p className="mt-1.5 text-xs text-danger">
              Você ainda não está habilitado em nenhum serviço. Peça ao administrador.
            </p>
          )}
          {souCliente && servicos && !servicosDisponiveis.length && (
            <p className="mt-1.5 text-xs text-danger">
              {responsavel?.nome ?? 'Seu passeador'} ainda não tem serviços disponíveis. Fale com a empresa.
            </p>
          )}
        </div>

        <Input
          label="Observações"
          name="observacoes"
          placeholder="Opcional"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />

        {mutation.isError && (
          <p role="alert" className="text-sm text-danger">
            {mensagemErro(mutation.error) ?? 'Não foi possível agendar. Confira os dados e tente de novo.'}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {souCliente
              ? 'Enviar pedido'
              : souFuncionario
                ? `Enviar para ${texto.min(termos.cliente)} confirmar`
                : `Agendar ${texto.min(termos.ordem)}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Abas sublinhadas (Próximos / Anteriores)
function Abas({
  aba,
  onAba,
  itens,
}: {
  aba: Aba;
  onAba: (aba: Aba) => void;
  itens: [Aba, string, number][];
}) {
  return (
    <div role="tablist" aria-label="Filtrar" className="mb-4 flex gap-5 border-b border-border">
      {itens.map(([valor, rotulo, qtd]) => (
        <button
          key={valor}
          role="tab"
          aria-selected={aba === valor}
          onClick={() => onAba(valor)}
          className={`-mb-px flex items-center gap-2 border-b-2 px-0.5 pb-2.5 pt-1 text-sm font-medium transition-colors ${
            aba === valor ? 'border-primary text-primary-text' : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          {rotulo}
          <span className="num rounded-md bg-surface px-1.5 text-xs text-text-muted">{qtd}</span>
        </button>
      ))}
    </div>
  );
}
