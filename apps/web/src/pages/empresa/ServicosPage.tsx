import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  Briefcase,
  Check,
  ClipboardList,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Trash2,
  Users as UsersIcon,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useFecharFora } from '../../components/UserMenu';
import { Avatar } from '../../components/ui/Avatar';
import { Tag } from '../../components/ui/Badge';
import { Button, IconButton } from '../../components/ui/Button';
import { PageHeader, Skeleton } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { formatarMoeda } from '../../lib/format';
import { texto } from '../../lib/segmentos';
import type { Membro, Servico, TipoCampoRelatorio } from '../../types';
import type { EmpresaOutletContext } from './EmpresaLayout';

const TIPO_CAMPO_LABEL: Record<TipoCampoRelatorio, string> = {
  CHECKBOX: 'Confirmação (sim/não)',
  TEXTO_CURTO: 'Texto curto',
  TEXTO_LONGO: 'Texto longo',
};

export function ServicosPage() {
  const { empresaId, papel, termos, vinculoId } = useOutletContext<EmpresaOutletContext>();
  const isAdmin = papel === 'ADMIN';
  const queryClient = useQueryClient();

  const [formAberto, setFormAberto] = useState(false);
  const [servicoEditandoId, setServicoEditandoId] = useState<string | null>(null);
  const [servicoExecutoresId, setServicoExecutoresId] = useState<string | null>(null);
  const [servicoChecklistId, setServicoChecklistId] = useState<string | null>(null);

  const { data: servicos, isLoading } = useQuery({
    queryKey: ['servicos', empresaId],
    queryFn: async () =>
      (
        await api.get<Servico[]>(`/empresas/${empresaId}/servicos`, {
          params: isAdmin ? { incluirInativos: 'true' } : undefined,
        })
      ).data,
  });

  const toggleAtivo = useMutation({
    mutationFn: async (servico: Servico) =>
      api.patch(`/empresas/${empresaId}/servicos/${servico.id}`, { ativo: !servico.ativo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicos', empresaId] }),
  });

  const lista = [...(servicos ?? [])].sort((a, b) => Number(b.ativo) - Number(a.ativo));

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        titulo="Serviços"
        descricao={isAdmin ? 'O catálogo da empresa: valores, quem faz e o que vai no relatório' : 'O que essa empresa oferece'}
        acoes={
          (isAdmin || papel === 'EXECUTOR') && (
            <Button onClick={() => setFormAberto(true)}>
              <Plus size={16} />
              Novo serviço
            </Button>
          )
        }
      />

      {isAdmin && servicos && <ServicosParaAprovar servicos={servicos} empresaId={empresaId} />}
      {isAdmin && servicos && <PrecosParaAprovar servicos={servicos} empresaId={empresaId} />}
      {papel === 'EXECUTOR' && servicos && (
        <MeusPrecos servicos={servicos} empresaId={empresaId} vinculoId={vinculoId} />
      )}

      {isLoading ? (
        <Skeleton linhas={4} />
      ) : !lista.length ? (
        <EmptyState
          icon={Briefcase}
          title="Nenhum serviço cadastrado"
          description={
            isAdmin
              ? 'Cadastre o primeiro serviço com nome e valor. Depois defina quem faz e o checklist do relatório.'
              : 'Ainda não há serviços cadastrados nessa empresa.'
          }
          action={
            isAdmin ? (
              <Button variant="secondary" onClick={() => setFormAberto(true)}>
                <Plus size={15} />
                Novo serviço
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-panel shadow-card">
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_110px_120px_40px] items-center gap-4 rounded-t-xl border-b border-border bg-surface/60 px-5 py-2.5 text-xs font-medium text-text-muted md:grid">
            <span>Serviço</span>
            <span>{termos.executor.plural}</span>
            <span>Checklist</span>
            <span className="text-right">Valor</span>
            <span />
          </div>
          <ul>
            {lista.map((servico) => (
              <li
                key={servico.id}
                className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3.5 last:rounded-b-xl last:border-0 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_110px_120px_40px] ${
                  servico.ativo ? '' : 'bg-surface/40'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`truncate text-sm font-medium ${servico.ativo ? "text-text" : "text-text-muted"}`}>
                      {servico.nome}
                    </p>
                    {!servico.ativo && <Tag>Inativo</Tag>}
                    {!servico.aprovado && <Tag tom="acento">Aguardando aprovação</Tag>}
                  </div>
                  {servico.descricao && (
                    <p className="mt-0.5 truncate text-[13px] text-text-muted">{servico.descricao}</p>
                  )}
                  {!servico.aprovado && servico.criadoPor?.vinculoId === vinculoId && (
                    <DesistirDoServico servico={servico} empresaId={empresaId} />
                  )}
                </div>

                <p className="num text-right text-sm font-semibold text-text md:hidden">{formatarMoeda(servico.valor)}</p>

                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => setServicoExecutoresId(servico.id)}
                  className="col-span-2 flex items-center gap-2 text-left disabled:cursor-default md:col-span-1"
                >
                  {servico.executores.length ? (
                    <>
                      <span className="flex -space-x-1.5">
                        {servico.executores.slice(0, 3).map((ex) => (
                          <span key={ex.vinculoExecutorId} title={ex.nome} className="rounded-full ring-2 ring-panel">
                            <Avatar nome={ex.nome} size={24} />
                          </span>
                        ))}
                      </span>
                      <span className="truncate text-[13px] text-text-muted">
                        {servico.executores.length === 1
                          ? servico.executores[0].nome.split(' ')[0]
                          : `${servico.executores.length} pessoas`}
                      </span>
                    </>
                  ) : (
                    <span className={`text-[13px] ${isAdmin ? 'text-danger' : 'text-text-subtle'}`}>
                      {isAdmin ? `Definir ${texto.min(termos.executor, true)}` : '—'}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => setServicoChecklistId(servico.id)}
                  className="hidden text-left text-[13px] text-text-muted enabled:hover:text-text disabled:cursor-default md:block"
                >
                  {servico.camposRelatorio.length
                    ? `${servico.camposRelatorio.length} ${servico.camposRelatorio.length === 1 ? 'item' : 'itens'}`
                    : 'Sem itens'}
                </button>

                <p className="num hidden text-right text-sm font-semibold text-text md:block">
                  {formatarMoeda(servico.valor)}
                </p>

                <div className="hidden justify-end md:flex">
                  {isAdmin && (
                    <MenuServico
                      ativo={servico.ativo}
                      termos={termos}
                      onEditar={() => setServicoEditandoId(servico.id)}
                      onExecutores={() => setServicoExecutoresId(servico.id)}
                      onChecklist={() => setServicoChecklistId(servico.id)}
                      onAtivo={() => toggleAtivo.mutate(servico)}
                    />
                  )}
                </div>

                {isAdmin && (
                  <div className="col-span-2 flex gap-1 md:hidden">
                    <Button tamanho="sm" variant="secondary" onClick={() => setServicoEditandoId(servico.id)}>
                      <Pencil size={13} /> Editar
                    </Button>
                    <Button tamanho="sm" variant="secondary" onClick={() => setServicoChecklistId(servico.id)}>
                      <ClipboardList size={13} /> Checklist
                    </Button>
                    <Button tamanho="sm" variant="ghost" onClick={() => toggleAtivo.mutate(servico)}>
                      {servico.ativo ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ServicoFormModal
        key={servicoEditandoId ?? 'novo'}
        open={formAberto || !!servicoEditandoId}
        servico={servicos?.find((s) => s.id === servicoEditandoId) ?? null}
        empresaId={empresaId}
        onClose={() => {
          setFormAberto(false);
          setServicoEditandoId(null);
        }}
      />

      {(() => {
        const servico = servicos?.find((s) => s.id === servicoExecutoresId);
        return servico && <ExecutoresModal servico={servico} empresaId={empresaId} onClose={() => setServicoExecutoresId(null)} />;
      })()}

      {(() => {
        const servico = servicos?.find((s) => s.id === servicoChecklistId);
        return servico && <ChecklistModal servico={servico} empresaId={empresaId} onClose={() => setServicoChecklistId(null)} />;
      })()}
    </div>
  );
}

function MenuServico({
  ativo,
  termos,
  onEditar,
  onExecutores,
  onChecklist,
  onAtivo,
}: {
  ativo: boolean;
  termos: EmpresaOutletContext['termos'];
  onEditar: () => void;
  onExecutores: () => void;
  onChecklist: () => void;
  onAtivo: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useFecharFora<HTMLDivElement>(aberto, () => setAberto(false));
  const item = (fn: () => void) => () => {
    setAberto(false);
    fn();
  };
  const cls =
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-text-muted transition-colors hover:bg-surface hover:text-text';

  return (
    <div ref={ref} className="relative">
      <IconButton label="Ações do serviço" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <MoreHorizontal size={16} />
      </IconButton>
      {aberto && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-56 animate-[surgir_140ms_cubic-bezier(0.16,1,0.3,1)] rounded-xl border border-border bg-panel p-1.5 shadow-overlay"
        >
          <button role="menuitem" className={cls} onClick={item(onEditar)}>
            <Pencil size={14} /> Editar
          </button>
          <button role="menuitem" className={cls} onClick={item(onExecutores)}>
            <UsersIcon size={14} /> {termos.executor.plural}
          </button>
          <button role="menuitem" className={cls} onClick={item(onChecklist)}>
            <ClipboardList size={14} /> Checklist do relatório
          </button>
          <div className="my-1 border-t border-border" />
          <button role="menuitem" className={cls} onClick={item(onAtivo)}>
            <Power size={14} /> {ativo ? 'Desativar' : 'Ativar'}
          </button>
        </div>
      )}
    </div>
  );
}

function ServicoFormModal({
  open,
  servico,
  empresaId,
  onClose,
}: {
  open: boolean;
  servico: Servico | null;
  empresaId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { papel } = useOutletContext<EmpresaOutletContext>();
  const doPasseador = papel === 'EXECUTOR';
  const [nome, setNome] = useState(servico?.nome ?? '');
  const [descricao, setDescricao] = useState(servico?.descricao ?? '');
  const [valor, setValor] = useState(servico?.valor ?? '');

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { nome, descricao: descricao || undefined, valor: Number(valor) };
      if (servico) return api.patch(`/empresas/${empresaId}/servicos/${servico.id}`, payload);
      return api.post(`/empresas/${empresaId}/servicos`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos', empresaId] });
      onClose();
      setNome('');
      setDescricao('');
      setValor('');
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={servico ? 'Editar serviço' : 'Novo serviço'}
      description={
        doPasseador
          ? 'Vai para o administrador aprovar. Depois de aprovado, você já pode fazer esse serviço.'
          : 'Aparece no catálogo para a equipe e os clientes.'
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Nome" name="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
        <Input
          label="Descrição"
          name="descricao"
          placeholder="Opcional"
          value={descricao ?? ''}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <Input
          label="Valor (R$)"
          name="valor"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          className="num"
          required
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        {mutation.isError && (
          <p role="alert" className="text-sm text-danger">
            Não foi possível salvar. Confira os dados e tente de novo.
          </p>
        )}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {servico ? 'Salvar alterações' : doPasseador ? 'Enviar para aprovação' : 'Criar serviço'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function mensagemDeErro(erro: unknown) {
  const msg = isAxiosError(erro) ? erro.response?.data?.message : null;
  if (Array.isArray(msg)) return msg[0];
  if (typeof msg === 'string') return msg;
  return 'Não foi possível salvar. Tente de novo.';
}

function diaCurto(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(new Date(iso)).replace(/\./g, '');
}

// Admin: serviços que os passeadores criaram e ainda não foram aprovados
function ServicosParaAprovar({ servicos, empresaId }: { servicos: Servico[]; empresaId: string }) {
  const { termos } = useOutletContext<EmpresaOutletContext>();
  const queryClient = useQueryClient();
  const pedidos = servicos.filter((s) => !s.aprovado);

  const responder = useMutation({
    mutationFn: async (args: { servicoId: string; aprovar: boolean }) =>
      api.patch(`/empresas/${empresaId}/servicos/${args.servicoId}/aprovacao`, { aprovar: args.aprovar }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicos', empresaId] }),
  });

  if (!pedidos.length) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-dashed border-primary/60 bg-panel">
      <div className="border-b border-border bg-primary-soft/50 px-5 py-3">
        <p className="text-sm font-semibold text-text">
          {pedidos.length === 1 ? 'Um serviço novo' : `${pedidos.length} serviços novos`} para aprovar
        </p>
        <p className="text-[13px] text-text-muted">
          Criados por {texto.min(termos.executor, true)}. Antes de aprovar, dá para ajustar nome, valor e checklist na
          lista abaixo. Só dá para agendar depois de aprovado.
        </p>
      </div>
      <ul>
        {pedidos.map((s) => {
          const ocupado = responder.isPending && responder.variables?.servicoId === s.id;
          return (
            <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3 last:border-0">
              <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                <Avatar nome={s.criadoPor?.nome ?? s.nome} size={32} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text">{s.nome}</p>
                  <p className="truncate text-[13px] text-text-muted">
                    <span className="num font-semibold text-text">{formatarMoeda(s.valor)}</span>
                    {s.criadoPor && ` · criado por ${s.criadoPor.nome}`}
                    {s.descricao && ` · ${s.descricao}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  tamanho="sm"
                  variant="secondary"
                  loading={ocupado && responder.variables?.aprovar === false}
                  onClick={() => responder.mutate({ servicoId: s.id, aprovar: false })}
                >
                  Recusar
                </Button>
                <Button
                  tamanho="sm"
                  loading={ocupado && responder.variables?.aprovar === true}
                  onClick={() => responder.mutate({ servicoId: s.id, aprovar: true })}
                >
                  <Check size={14} strokeWidth={2.5} />
                  Aprovar
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// Passeador desiste do serviço que criou, enquanto ainda não foi aprovado
function DesistirDoServico({ servico, empresaId }: { servico: Servico; empresaId: string }) {
  const queryClient = useQueryClient();
  const desistir = useMutation({
    mutationFn: async () => api.delete(`/empresas/${empresaId}/servicos/${servico.id}/pedido`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicos', empresaId] }),
  });
  return (
    <p className="mt-1 text-xs text-text-subtle">
      Você criou esse serviço. Ele vale depois que o administrador aprovar ·{' '}
      <button
        type="button"
        disabled={desistir.isPending}
        onClick={() => desistir.mutate()}
        className="font-medium text-text-muted underline-offset-2 hover:text-danger hover:underline"
      >
        {desistir.isPending ? 'desistindo…' : 'desistir'}
      </button>
    </p>
  );
}

// Admin: preços que os passeadores pediram e ainda não foram respondidos
function PrecosParaAprovar({ servicos, empresaId }: { servicos: Servico[]; empresaId: string }) {
  const { termos } = useOutletContext<EmpresaOutletContext>();
  const queryClient = useQueryClient();
  const pedidos = servicos.flatMap((s) =>
    s.executores.filter((e) => e.valorProposto !== null).map((e) => ({ servico: s, executor: e })),
  );

  const responder = useMutation({
    mutationFn: async (args: { servicoId: string; vinculoExecutorId: string; aprovar: boolean }) =>
      api.patch(`/empresas/${empresaId}/servicos/${args.servicoId}/executores/${args.vinculoExecutorId}/preco`, {
        aprovar: args.aprovar,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicos', empresaId] }),
  });

  if (!pedidos.length) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-dashed border-primary/60 bg-panel">
      <div className="border-b border-border bg-primary-soft/50 px-5 py-3">
        <p className="text-sm font-semibold text-text">
          {pedidos.length === 1 ? 'Um preço' : `${pedidos.length} preços`} para aprovar
        </p>
        <p className="text-[13px] text-text-muted">
          {termos.executor.plural} pediram para cobrar outro valor. O novo preço só vale depois que você aprovar.
        </p>
      </div>
      <ul>
        {pedidos.map(({ servico, executor }) => {
          const chave = { servicoId: servico.id, vinculoExecutorId: executor.vinculoExecutorId };
          const ocupado =
            responder.isPending &&
            responder.variables?.servicoId === servico.id &&
            responder.variables?.vinculoExecutorId === executor.vinculoExecutorId;
          const atual = executor.valor ?? servico.valor;
          return (
            <li
              key={`${servico.id}-${executor.vinculoExecutorId}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3 last:border-0"
            >
              <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                <Avatar nome={executor.nome} size={32} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text">
                    {executor.nome} · {servico.nome}
                  </p>
                  <p className="text-[13px] text-text-muted">
                    <span className="num line-through decoration-text-subtle">{formatarMoeda(atual)}</span>
                    {' → '}
                    <span className="num font-semibold text-text">{formatarMoeda(executor.valorProposto!)}</span>
                    {executor.propostoEm && <span className="text-text-subtle"> · pedido em {diaCurto(executor.propostoEm)}</span>}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  tamanho="sm"
                  variant="secondary"
                  loading={ocupado && responder.variables?.aprovar === false}
                  onClick={() => responder.mutate({ ...chave, aprovar: false })}
                >
                  Recusar
                </Button>
                <Button
                  tamanho="sm"
                  loading={ocupado && responder.variables?.aprovar === true}
                  onClick={() => responder.mutate({ ...chave, aprovar: true })}
                >
                  <Check size={14} strokeWidth={2.5} />
                  Aprovar
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// Passeador: o preço que cobra em cada serviço que faz, e o pedido de um novo preço
function MeusPrecos({ servicos, empresaId, vinculoId }: { servicos: Servico[]; empresaId: string; vinculoId: string }) {
  const meus = servicos
    .filter((s) => s.ativo && s.aprovado)
    .flatMap((s) => {
      const eu = s.executores.find((e) => e.vinculoExecutorId === vinculoId);
      return eu ? [{ servico: s, eu }] : [];
    });

  if (!meus.length) return null;

  return (
    <section>
      <div className="mb-2">
        <p className="text-sm font-semibold text-text">Meus preços</p>
        <p className="text-[13px] text-text-muted">
          Quer cobrar outro valor? Peça aqui. O novo preço passa a valer quando o administrador aprovar.
        </p>
      </div>
      <ul className="rounded-xl border border-border bg-panel shadow-card">
        {meus.map(({ servico, eu }) => (
          <MeuPreco key={servico.id} servico={servico} eu={eu} empresaId={empresaId} />
        ))}
      </ul>
    </section>
  );
}

function MeuPreco({
  servico,
  eu,
  empresaId,
}: {
  servico: Servico;
  eu: Servico['executores'][number];
  empresaId: string;
}) {
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState('');
  const atual = eu.valor ?? servico.valor;

  const propor = useMutation({
    mutationFn: async (novo: number) => api.post(`/empresas/${empresaId}/servicos/${servico.id}/meu-preco`, { valor: novo }),
    onSuccess: () => {
      setEditando(false);
      setValor('');
      queryClient.invalidateQueries({ queryKey: ['servicos', empresaId] });
    },
  });
  const cancelar = useMutation({
    mutationFn: async () => api.delete(`/empresas/${empresaId}/servicos/${servico.id}/meu-preco`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicos', empresaId] }),
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    const novo = Number(valor.replace(',', '.'));
    if (!novo || novo <= 0) return;
    propor.mutate(novo);
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-5 py-3 last:border-0">
      <div className="min-w-0 flex-1 basis-48">
        <p className="truncate text-sm font-medium text-text">{servico.nome}</p>
        <p className="text-[13px] text-text-muted">
          <span className="num font-semibold text-text">{formatarMoeda(atual)}</span>
          {eu.valor ? ' · seu preço' : ' · preço da empresa'}
          {eu.valorProposto && (
            <span className="text-primary-text">
              {' '}
              · pediu <span className="num font-semibold">{formatarMoeda(eu.valorProposto)}</span>, aguardando aprovação
            </span>
          )}
        </p>
        {(propor.isError || cancelar.isError) && (
          <p role="alert" className="mt-1 text-xs text-danger">
            {mensagemDeErro(propor.error ?? cancelar.error)}
          </p>
        )}
      </div>
      {editando ? (
        <form onSubmit={enviar} className="flex items-center gap-2">
          <span className="flex h-8 items-center rounded-lg border border-border-strong bg-panel text-[13px] focus-within:border-primary">
            <span className="pl-2 text-text-subtle">R$</span>
            <input
              autoFocus
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={String(Number(atual)).replace('.', ',')}
              aria-label={`Novo preço para ${servico.nome}`}
              className="num h-full w-20 bg-transparent px-2 text-right text-text outline-none"
            />
          </span>
          <Button tamanho="sm" variant="ghost" type="button" onClick={() => setEditando(false)}>
            Cancelar
          </Button>
          <Button tamanho="sm" type="submit" loading={propor.isPending}>
            Pedir
          </Button>
        </form>
      ) : eu.valorProposto ? (
        <Button tamanho="sm" variant="ghost" loading={cancelar.isPending} onClick={() => cancelar.mutate()}>
          Desistir do pedido
        </Button>
      ) : (
        <Button tamanho="sm" variant="secondary" onClick={() => setEditando(true)}>
          <Pencil size={13} />
          Pedir outro preço
        </Button>
      )}
    </li>
  );
}

function ExecutoresModal({ servico, empresaId, onClose }: { servico: Servico; empresaId: string; onClose: () => void }) {
  const { termos } = useOutletContext<EmpresaOutletContext>();
  const queryClient = useQueryClient();
  const { data: membros } = useQuery({
    queryKey: ['membros', empresaId],
    queryFn: async () => (await api.get<Membro[]>(`/empresas/${empresaId}/membros`)).data,
  });

  const executores = membros?.filter((m) => m.papel === 'EXECUTOR') ?? [];
  const idsAssociados = new Set(servico.executores.map((e) => e.vinculoExecutorId));

  const adicionar = useMutation({
    mutationFn: async (vinculoExecutorId: string) =>
      api.post(`/empresas/${empresaId}/servicos/${servico.id}/executores`, { vinculoExecutorId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicos', empresaId] }),
  });

  const remover = useMutation({
    mutationFn: async (vinculoExecutorId: string) =>
      api.delete(`/empresas/${empresaId}/servicos/${servico.id}/executores/${vinculoExecutorId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicos', empresaId] }),
  });

  const voltarPreco = useMutation({
    mutationFn: async (vinculoExecutorId: string) =>
      api.delete(`/empresas/${empresaId}/servicos/${servico.id}/executores/${vinculoExecutorId}/preco`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicos', empresaId] }),
  });

  return (
    <Modal open onClose={onClose} title={termos.executor.plural} description={`Quem pode ser designado para “${servico.nome}”`}>
      {!executores.length ? (
        <p className="py-4 text-center text-sm text-text-muted">
          {texto.nenhum(termos.executor)} {texto.cadastrado(termos.executor)} na equipe ainda. Convide em Equipe.
        </p>
      ) : (
        <ul className="-mx-1 flex flex-col">
          {executores.map((membro) => {
            const associado = idsAssociados.has(membro.id);
            const precoProprio = servico.executores.find((e) => e.vinculoExecutorId === membro.id)?.valor;
            const ocupado =
              (adicionar.isPending && adicionar.variables === membro.id) ||
              (remover.isPending && remover.variables === membro.id);
            return (
              <li key={membro.id} className="flex items-center justify-between gap-3 rounded-lg px-1 py-2">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar nome={membro.user.nome} size={32} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{membro.user.nome}</p>
                    <p className="truncate text-xs text-text-muted">
                      {precoProprio ? (
                        <>
                          Cobra <span className="num font-medium text-text">{formatarMoeda(precoProprio)}</span> ·{' '}
                          <button
                            type="button"
                            className="underline-offset-2 hover:text-text hover:underline"
                            onClick={() => voltarPreco.mutate(membro.id)}
                          >
                            usar o preço da empresa
                          </button>
                        </>
                      ) : (
                        membro.user.email
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  tamanho="sm"
                  variant={associado ? 'secondary' : 'primary'}
                  onClick={() => (associado ? remover.mutate(membro.id) : adicionar.mutate(membro.id))}
                  loading={ocupado}
                >
                  {associado ? 'Remover' : 'Adicionar'}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}

function ChecklistModal({ servico, empresaId, onClose }: { servico: Servico; empresaId: string; onClose: () => void }) {
  const { termos } = useOutletContext<EmpresaOutletContext>();
  const queryClient = useQueryClient();
  const [rotulo, setRotulo] = useState('');
  const [tipo, setTipo] = useState<TipoCampoRelatorio>('CHECKBOX');
  const [obrigatorio, setObrigatorio] = useState(false);

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['servicos', empresaId] });

  const adicionar = useMutation({
    mutationFn: async () =>
      api.post(`/empresas/${empresaId}/servicos/${servico.id}/campos-relatorio`, {
        rotulo,
        tipo,
        obrigatorio,
        ordem: servico.camposRelatorio.length,
      }),
    onSuccess: () => {
      invalidar();
      setRotulo('');
      setTipo('CHECKBOX');
      setObrigatorio(false);
    },
  });

  const remover = useMutation({
    mutationFn: async (campoId: string) =>
      api.delete(`/empresas/${empresaId}/servicos/${servico.id}/campos-relatorio/${campoId}`),
    onSuccess: invalidar,
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!rotulo.trim()) return;
    adicionar.mutate();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Checklist do relatório"
      description={`O que ${texto.o(termos.executor)} preenche ao finalizar “${servico.nome}”`}
    >
      <div className="flex flex-col gap-5">
        {!servico.camposRelatorio.length ? (
          <p className="rounded-lg bg-surface px-3.5 py-3 text-[13px] text-text-muted">
            Nenhum item ainda. Sem itens, o relatório tem só horário, observações e fotos.
          </p>
        ) : (
          <ol className="overflow-hidden rounded-lg border border-border">
            {servico.camposRelatorio.map((campo, i) => (
              <li key={campo.id} className="flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-0">
                <span className="num w-5 text-xs text-text-subtle">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text">{campo.rotulo}</p>
                  <p className="text-xs text-text-muted">
                    {TIPO_CAMPO_LABEL[campo.tipo]}
                    {campo.obrigatorio && ' · obrigatório'}
                  </p>
                </div>
                <IconButton label={`Remover “${campo.rotulo}”`} perigo onClick={() => remover.mutate(campo.id)}>
                  <Trash2 size={14} />
                </IconButton>
              </li>
            ))}
          </ol>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-border pt-5">
          <Input
            label="Novo item"
            name="rotuloCampo"
            placeholder="Ex.: Bebeu água"
            value={rotulo}
            onChange={(e) => setRotulo(e.target.value)}
          />
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor="tipo-campo" className="rotulo">
                Tipo
              </label>
              <select
                id="tipo-campo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoCampoRelatorio)}
                className="campo"
              >
                {Object.entries(TIPO_CAMPO_LABEL).map(([valor, label]) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <label className="mb-2.5 flex items-center gap-2 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={obrigatorio}
                onChange={(e) => setObrigatorio(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              Obrigatório
            </label>
          </div>
          <Button type="submit" variant="secondary" loading={adicionar.isPending} disabled={!rotulo.trim()}>
            <Plus size={15} />
            Adicionar item
          </Button>
        </form>
      </div>
    </Modal>
  );
}
