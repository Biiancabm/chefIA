import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Link2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';
import { Button, IconButton } from '../../components/ui/Button';
import { PageHeader, SectionTitle, Skeleton } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { copiarTexto } from '../../lib/clipboard';
import { formatarData, formatarMoeda } from '../../lib/format';
import { texto } from '../../lib/segmentos';
import type { Convite, Membro, ModeloRemuneracao, PapelVinculo, Servico } from '../../types';
import type { EmpresaOutletContext } from './EmpresaLayout';

type Termos = EmpresaOutletContext['termos'];

export function EquipePage() {
  const { empresaId, termos, modeloRemuneracao: modelo } = useOutletContext<EmpresaOutletContext>();
  const GRUPOS: { papel: PapelVinculo; titulo: string; vazio: string }[] = [
    {
      papel: 'EXECUTOR',
      titulo: termos.executor.plural,
      vazio: `Convide ${texto.um(termos.executor)} para começar a distribuir ${texto.os(termos.ordem)}.`,
    },
    {
      papel: 'CLIENTE',
      titulo: termos.cliente.plural,
      vazio: `Convide ${texto.min(termos.cliente, true)} para acompanharem o histórico e os relatórios.`,
    },
  ];
  const queryClient = useQueryClient();
  const [conviteModalAberto, setConviteModalAberto] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);

  const { data: membros, isLoading: carregandoMembros } = useQuery({
    queryKey: ['membros', empresaId],
    queryFn: async () => (await api.get<Membro[]>(`/empresas/${empresaId}/membros`)).data,
  });

  const { data: convites, isLoading: carregandoConvites } = useQuery({
    queryKey: ['convites', empresaId],
    queryFn: async () => (await api.get<Convite[]>(`/empresas/${empresaId}/convites`)).data,
  });

  const removerMembro = useMutation({
    mutationFn: async (vinculoId: string) => api.delete(`/empresas/${empresaId}/membros/${vinculoId}`),
    onSuccess: () => {
      setRemovendoId(null);
      queryClient.invalidateQueries({ queryKey: ['membros', empresaId] });
    },
  });

  const definirResponsavel = useMutation({
    mutationFn: async (args: { clienteId: string; responsavelId: string | null }) =>
      api.patch(`/empresas/${empresaId}/membros/${args.clienteId}/responsavel`, {
        vinculoResponsavelId: args.responsavelId,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['membros', empresaId] }),
  });

  const executores = membros?.filter((m) => m.papel === 'EXECUTOR') ?? [];

  const revogarConvite = useMutation({
    mutationFn: async (conviteId: string) => api.delete(`/empresas/${empresaId}/convites/${conviteId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['convites', empresaId] }),
  });

  return (
    <div className="flex flex-col gap-9">
      <PageHeader
        titulo="Equipe"
        descricao={`${termos.executor.plural} e ${texto.min(termos.cliente, true)} da empresa, e quem atende quem`}
        acoes={
          <Button onClick={() => setConviteModalAberto(true)}>
            <Plus size={16} />
            Convidar
          </Button>
        }
      />

      {carregandoMembros ? (
        <Skeleton linhas={4} />
      ) : (
        GRUPOS.map((grupo) => {
          const lista = membros?.filter((m) => m.papel === grupo.papel) ?? [];
          return (
            <section key={grupo.papel}>
              <SectionTitle contagem={lista.length}>{grupo.titulo}</SectionTitle>
              {!lista.length ? (
                <p className="rounded-xl border border-dashed border-border-strong px-5 py-6 text-sm text-text-muted">
                  {grupo.vazio}
                </p>
              ) : (
                <ul className="rounded-xl border border-border bg-panel shadow-card">
                  {lista.map((membro) => (
                    <li
                      key={membro.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b border-border px-4 py-3 last:border-0 sm:px-5"
                    >
                      <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                        <Avatar nome={membro.user.nome} size={32} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text">{membro.user.nome}</p>
                          <p className="truncate text-[13px] text-text-muted">{membro.user.email}</p>
                        </div>
                      </div>

                      {membro.papel === 'EXECUTOR' && (
                        <>
                          <span className="num text-[13px] text-text-muted">
                            {contarClientes(membros ?? [], membro.id, termos)}
                          </span>
                          <CampoRemuneracao key={modelo} empresaId={empresaId} membro={membro} modelo={modelo} />
                        </>
                      )}

                      {membro.papel === 'CLIENTE' && (
                        <label className="flex items-center gap-2 text-[13px] text-text-muted">
                          <span className="hidden sm:inline">Atendido por</span>
                          <select
                            value={membro.vinculoResponsavelId ?? ''}
                            aria-label={`${termos.executor.singular} responsável por ${membro.user.nome}`}
                            onChange={(e) =>
                              definirResponsavel.mutate({ clienteId: membro.id, responsavelId: e.target.value || null })
                            }
                            className={`campo h-8! w-44! py-0! text-[13px]! ${
                              membro.vinculoResponsavelId ? '' : 'border-danger/50! text-danger!'
                            }`}
                          >
                            <option value="">Sem responsável</option>
                            {executores.map((ex) => (
                              <option key={ex.id} value={ex.id}>
                                {ex.user.nome}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}

                      <div className="ml-auto flex items-center gap-1">
                        {removendoId === membro.id ? (
                          <>
                            <Button tamanho="sm" variant="ghost" onClick={() => setRemovendoId(null)}>
                              Não
                            </Button>
                            <Button
                              tamanho="sm"
                              variant="danger"
                              loading={removerMembro.isPending}
                              onClick={() => removerMembro.mutate(membro.id)}
                            >
                              Remover
                            </Button>
                          </>
                        ) : (
                          <IconButton label={`Remover ${membro.user.nome}`} perigo onClick={() => setRemovendoId(membro.id)}>
                            <X size={15} />
                          </IconButton>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}

      <section>
        <SectionTitle contagem={convites?.length}>Convites ativos</SectionTitle>
        {!carregandoConvites && !convites?.length && (
          <EmptyState
            icon={Link2}
            title="Nenhum convite ativo"
            description={`Gere um link para ${texto.um(termos.executor)} ou ${texto.um(termos.cliente)} entrar na empresa. Vale por 72 horas.`}
            action={
              <Button variant="secondary" onClick={() => setConviteModalAberto(true)}>
                <Plus size={15} />
                Convidar
              </Button>
            }
          />
        )}
        {!!convites?.length && (
          <ul className="rounded-xl border border-border bg-panel shadow-card">
            {convites.map((convite) => (
              <ConviteRow
                key={convite.id}
                convite={convite}
                termos={termos}
                nomeResponsavel={executores.find((ex) => ex.id === convite.vinculoResponsavelId)?.user.nome}
                onRevogar={() => revogarConvite.mutate(convite.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <ConviteModal
        open={conviteModalAberto}
        empresaId={empresaId}
        termos={termos}
        executores={executores}
        onClose={() => setConviteModalAberto(false)}
      />
    </div>
  );
}

// Comissão (%) ou salário do passeador, editável na própria linha. Salva ao sair do campo.
function CampoRemuneracao({
  empresaId,
  membro,
  modelo,
}: {
  empresaId: string;
  membro: Membro;
  modelo: ModeloRemuneracao;
}) {
  const queryClient = useQueryClient();
  const comissao = modelo === 'COMISSAO';
  const salvo = comissao ? membro.comissaoPercentual : membro.salarioMensal;
  const [valor, setValor] = useState(salvo ? String(Number(salvo)) : '');

  const salvar = useMutation({
    mutationFn: async (novo: number | null) =>
      api.patch(`/empresas/${empresaId}/membros/${membro.id}/remuneracao`, {
        [comissao ? 'comissaoPercentual' : 'salarioMensal']: novo,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['membros', empresaId] }),
  });

  function aoSair() {
    const digitado = valor.replace(',', '.').trim();
    const novo = digitado === '' ? null : Number(digitado);
    if (novo !== null && (Number.isNaN(novo) || novo < 0 || (comissao && novo > 100))) {
      setValor(salvo ? String(Number(salvo)) : '');
      return;
    }
    if (novo === (salvo === null ? null : Number(salvo))) return;
    salvar.mutate(novo);
  }

  return (
    <label className="flex items-center gap-2 text-[13px] text-text-muted">
      <span>{comissao ? 'Comissão' : 'Salário'}</span>
      <span
        className={`flex h-8 items-center rounded-lg border bg-panel text-[13px] focus-within:border-primary ${
          salvo ? 'border-border-strong' : 'border-danger/50'
        }`}
      >
        {!comissao && <span className="pl-2 text-text-subtle">R$</span>}
        <input
          inputMode="decimal"
          value={valor}
          placeholder={comissao ? '0' : '0,00'}
          aria-label={`${comissao ? 'Comissão em %' : 'Salário mensal'} de ${membro.user.nome}`}
          onChange={(e) => setValor(e.target.value)}
          onBlur={aoSair}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className={`num h-full bg-transparent px-2 text-right text-text outline-none ${comissao ? 'w-12' : 'w-20'}`}
        />
        {comissao && <span className="pr-2 text-text-subtle">%</span>}
      </span>
      {salvar.isPending && <span className="text-xs text-text-subtle">salvando…</span>}
      {salvar.isError && <span className="text-xs text-danger">não salvou</span>}
    </label>
  );
}

function contarClientes(membros: Membro[], executorId: string, termos: Termos) {
  const total = membros.filter((m) => m.vinculoResponsavelId === executorId).length;
  if (total === 0) return `Nenhum ${texto.min(termos.cliente)}`;
  return `${total} ${texto.min(termos.cliente, total > 1)}`;
}

function ConviteRow({
  convite,
  termos,
  nomeResponsavel,
  onRevogar,
}: {
  convite: Convite;
  termos: Termos;
  nomeResponsavel?: string;
  onRevogar: () => void;
}) {
  const link = `${window.location.origin}/convites/${convite.token}`;
  return (
    <li className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-0 sm:px-5">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 text-sm">
          <span className="font-medium text-text">
            {convite.papel === 'EXECUTOR' ? termos.executor.singular : termos.cliente.singular}
          </span>
          {nomeResponsavel && <span className="text-[13px] text-text-muted">atendido por {nomeResponsavel}</span>}
          <span className="num text-[13px] text-text-subtle">· expira {formatarData(convite.expiraEm)}</span>
        </p>
        <p className="truncate text-[13px] text-text-muted">{convite.emailConvidado ?? link}</p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <CopyButton texto={link} />
        <IconButton label="Revogar convite" perigo onClick={onRevogar}>
          <X size={15} />
        </IconButton>
      </div>
    </li>
  );
}

function CopyButton({ texto, comRotulo = false }: { texto: string; comRotulo?: boolean }) {
  const [estado, setEstado] = useState<'normal' | 'copiado' | 'falhou'>('normal');

  async function copiar() {
    setEstado((await copiarTexto(texto)) ? 'copiado' : 'falhou');
    setTimeout(() => setEstado('normal'), 2000);
  }

  const rotulo = { normal: 'Copiar link', copiado: 'Link copiado', falhou: 'Selecione e copie o link' }[estado];
  const icone = estado === 'copiado' ? <Check size={15} className="text-ok" /> : <Copy size={15} />;

  if (comRotulo) {
    return (
      <Button tamanho="sm" variant={estado === 'copiado' ? 'secondary' : 'primary'} onClick={copiar} aria-live="polite">
        {icone}
        {estado === 'normal' ? 'Copiar' : estado === 'copiado' ? 'Copiado' : 'Copie à mão'}
      </Button>
    );
  }

  return (
    <IconButton label={rotulo} onClick={copiar}>
      {icone}
    </IconButton>
  );
}

function ConviteModal({
  open,
  empresaId,
  termos,
  executores,
  onClose,
}: {
  open: boolean;
  empresaId: string;
  termos: Termos;
  executores: Membro[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [papel, setPapel] = useState<'EXECUTOR' | 'CLIENTE'>('EXECUTOR');
  const [email, setEmail] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  // Serviços que o passeador já faz ao entrar; null = ainda não mexeu (todos marcados)
  const [servicosEscolhidos, setServicosEscolhidos] = useState<string[] | null>(null);
  const [resultado, setResultado] = useState<{ link: string; email: string | null; servicos: number } | null>(null);

  const { data: servicos } = useQuery({
    queryKey: ['servicos', empresaId],
    queryFn: async () => (await api.get<Servico[]>(`/empresas/${empresaId}/servicos`)).data,
    enabled: open,
  });
  const ativos = servicos?.filter((s) => s.ativo && s.aprovado) ?? [];
  const marcados = servicosEscolhidos ?? ativos.map((s) => s.id);

  function alternarServico(id: string) {
    setServicosEscolhidos(marcados.includes(id) ? marcados.filter((s) => s !== id) : [...marcados, id]);
  }

  const mutation = useMutation({
    mutationFn: async () =>
      (
        await api.post<Convite>(`/empresas/${empresaId}/convites`, {
          papel,
          emailConvidado: email.trim() || undefined,
          vinculoResponsavelId: papel === 'CLIENTE' && responsavelId ? responsavelId : undefined,
          servicoIds: papel === 'EXECUTOR' ? marcados : undefined,
        })
      ).data,
    onSuccess: (convite) => {
      queryClient.invalidateQueries({ queryKey: ['convites', empresaId] });
      setResultado({
        link: `${window.location.origin}/convites/${convite.token}`,
        email: convite.emailConvidado,
        servicos: convite.servicoIds?.length ?? 0,
      });
    },
  });

  function fechar() {
    setResultado(null);
    setEmail('');
    setResponsavelId('');
    setServicosEscolhidos(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={fechar} title="Convidar para a empresa" description="A pessoa entra pelo link, com a própria conta.">
      {resultado ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-muted">
            {resultado.email ? (
              <>
                Convite enviado para <strong className="font-medium text-text">{resultado.email}</strong>. Você
                também pode mandar o link direto:
              </>
            ) : (
              'Envie este link para a pessoa (WhatsApp, email…). Ele vale por 72 horas.'
            )}
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface py-1 pl-1 pr-1">
            <input
              readOnly
              value={resultado.link}
              aria-label="Link do convite"
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 truncate bg-transparent px-2 text-sm text-text outline-none"
            />
            <CopyButton texto={resultado.link} comRotulo />
          </div>
          {resultado.servicos > 0 && (
            <p className="text-[13px] text-text-muted">
              Ao entrar, {texto.o(termos.executor)} já fica habilitado em {resultado.servicos}{' '}
              {resultado.servicos === 1 ? 'serviço' : 'serviços'}.
            </p>
          )}
          <div className="flex justify-end border-t border-border pt-4">
            <Button onClick={fechar}>Concluir</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <p className="rotulo">Convidar como</p>
            <div role="radiogroup" className="grid grid-cols-2 gap-0.5 rounded-lg bg-surface p-0.5">
              {(['EXECUTOR', 'CLIENTE'] as const).map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  role="radio"
                  aria-checked={papel === opcao}
                  onClick={() => setPapel(opcao)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    papel === opcao
                      ? 'bg-panel text-text shadow-[0_1px_2px_rgb(0_0_0/0.08)] dark:shadow-none dark:ring-1 dark:ring-border-strong'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  {opcao === 'EXECUTOR' ? termos.executor.singular : termos.cliente.singular}
                </button>
              ))}
            </div>
          </div>

          {papel === 'CLIENTE' && (
            <div>
              <label htmlFor="convite-resp" className="rotulo">
                {termos.executor.singular} responsável
              </label>
              {executores.length ? (
                <select
                  id="convite-resp"
                  value={responsavelId}
                  onChange={(e) => setResponsavelId(e.target.value)}
                  className="campo"
                >
                  <option value="">Escolher depois</option>
                  {executores.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.user.nome}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="rounded-lg bg-surface px-3 py-2.5 text-[13px] text-text-muted">
                  {texto.nenhum(termos.executor)} na equipe ainda. Dá para escolher depois, na lista de{' '}
                  {texto.min(termos.cliente, true)}.
                </p>
              )}
              <p className="mt-1.5 text-xs text-text-subtle">Quem vai atender e agendar para esse {texto.min(termos.cliente)}.</p>
            </div>
          )}

          {papel === 'EXECUTOR' && (
            <fieldset>
              <legend className="rotulo">Serviços que vai fazer</legend>
              {ativos.length ? (
                <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                  {ativos.map((s) => (
                    <li key={s.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm text-text">
                        <input
                          type="checkbox"
                          checked={marcados.includes(s.id)}
                          onChange={() => alternarServico(s.id)}
                          className="h-4 w-4 rounded"
                        />
                        <span className="min-w-0 flex-1 truncate">{s.nome}</span>
                        <span className="num shrink-0 text-[13px] text-text-muted">{formatarMoeda(s.valor)}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg bg-surface px-3 py-2.5 text-[13px] text-text-muted">
                  Nenhum serviço cadastrado ainda. Dá para habilitar depois, na tela Serviços.
                </p>
              )}
              <p className="mt-1.5 text-xs text-text-subtle">
                Ao aceitar o convite, {texto.o(termos.executor)} já pode ser escalado para esses serviços.
              </p>
            </fieldset>
          )}

          <Input
            label="Email"
            name="emailConvite"
            type="email"
            placeholder="Opcional · pessoa@exemplo.com"
            dica="Se informado, enviamos por email e só essa conta pode aceitar."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {mutation.isError && (
            <p role="alert" className="text-sm text-danger">
              Não foi possível criar o convite. Tente de novo.
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="ghost" onClick={fechar}>
              Cancelar
            </Button>
            <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>
              {email.trim() ? 'Enviar convite' : 'Gerar link'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
