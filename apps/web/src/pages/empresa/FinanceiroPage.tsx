import { useQuery } from '@tanstack/react-query';
import { Check, ChevronLeft, ChevronRight, CircleCheck, Undo2, Wallet, X } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { hora, resumoServicos } from '../../components/AgendaLista';
import {
  descricaoRecebimento,
  FormRecebimento,
  situacao,
  SituacaoBadge,
  SITUACOES,
  useDesfazerRecebimento,
  type Situacao,
} from '../../components/Recebimento';
import { Button, IconButton } from '../../components/ui/Button';
import { PageHeader, SectionTitle, Skeleton } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { api } from '../../lib/api';
import { formatarMoeda } from '../../lib/format';
import { texto, type Termo } from '../../lib/segmentos';
import { MODELOS } from '../../components/RemuneracaoPicker';
import type { Membro, ModeloRemuneracao, OrdemServico } from '../../types';
import type { EmpresaOutletContext } from './EmpresaLayout';
import { MeuFinanceiroPage } from './MeuFinanceiroPage';
import { GraficoMeses, Ranking, ultimosMeses, type Fatia } from '../../components/GraficosFinanceiro';

type Parte = Exclude<Situacao, 'cancelado'>;
type Aba = 'todos' | Parte;
const PARTES: Parte[] = ['recebido', 'receber', 'previsto'];

function inicioDoMes(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function somarMeses(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function noMes(iso: string, mes: Date) {
  const d = new Date(iso);
  return d.getFullYear() === mes.getFullYear() && d.getMonth() === mes.getMonth();
}

function nomeMes(mes: Date, comAno = true) {
  return new Intl.DateTimeFormat('pt-BR', comAno ? { month: 'long', year: 'numeric' } : { month: 'long' }).format(mes);
}

function diaCurto(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(new Date(iso)).replace(/\./g, '');
}

const maisRecente = (a: OrdemServico, b: OrdemServico) =>
  new Date(b.dataAgendada).getTime() - new Date(a.dataAgendada).getTime();

function quantos(n: number, termo: Termo) {
  return `${n} ${texto.min(termo, n !== 1)}`;
}

// Soma os itens das ordens por serviço ou por profissional (só os do passeador filtrado, se houver)
function agruparItens(ordens: OrdemServico[], por: 'servico' | 'executor', executorId = ''): Fatia[] {
  const mapa = new Map<string, Fatia>();
  for (const os of ordens) {
    for (const item of os.itens) {
      if (executorId && item.vinculoExecutorId !== executorId) continue;
      const chave = por === 'servico' ? item.servicoId : item.vinculoExecutorId;
      const nome = por === 'servico' ? item.servico.nome : item.vinculoExecutor.user.nome;
      const atual = mapa.get(chave) ?? { chave, nome, valor: 0, qtd: 0 };
      atual.valor += Number(item.valor);
      atual.qtd += 1;
      mapa.set(chave, atual);
    }
  }
  return [...mapa.values()].sort((a, b) => b.valor - a.valor);
}

// Admin vê o financeiro da empresa; o passeador vê quanto ele mesmo ganha
export function FinanceiroPage() {
  const { papel } = useOutletContext<EmpresaOutletContext>();
  return papel === 'EXECUTOR' ? <MeuFinanceiroPage /> : <FinanceiroEmpresa />;
}

function FinanceiroEmpresa() {
  const { empresaId, termos, modeloRemuneracao } = useOutletContext<EmpresaOutletContext>();
  const navigate = useNavigate();
  const [mes, setMes] = useState(() => inicioDoMes(new Date()));
  const [aba, setAba] = useState<Aba>('todos');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroExecutor, setFiltroExecutor] = useState('');

  const { data: ordens, isLoading } = useQuery({
    queryKey: ['ordens-servico', empresaId],
    queryFn: async () => (await api.get<OrdemServico[]>(`/empresas/${empresaId}/ordens-servico`)).data,
  });
  const { data: membros } = useQuery({
    queryKey: ['membros', empresaId],
    queryFn: async () => (await api.get<Membro[]>(`/empresas/${empresaId}/membros`)).data,
  });

  // Com um passeador filtrado, conta só a parte dele em cada atendimento
  const valorDe = (os: OrdemServico) =>
    filtroExecutor
      ? os.itens.filter((i) => i.vinculoExecutorId === filtroExecutor).reduce((t, i) => t + Number(i.valor), 0)
      : Number(os.valorTotal);
  const soma = (lista: OrdemServico[]) => lista.reduce((total, o) => total + valorDe(o), 0);

  const todasValidas = (ordens ?? []).filter((o) => situacao(o) !== 'cancelado');
  const clientesDoFiltro = unicos(todasValidas.map((o) => [o.vinculoClienteId, o.vinculoCliente.user.nome] as const));
  const executoresDoFiltro = unicos(
    todasValidas.flatMap((o) => o.itens.map((i) => [i.vinculoExecutorId, i.vinculoExecutor.user.nome] as const)),
  );
  const validas = todasValidas.filter(
    (o) =>
      (!filtroCliente || o.vinculoClienteId === filtroCliente) &&
      (!filtroExecutor || o.itens.some((i) => i.vinculoExecutorId === filtroExecutor)),
  );
  const filtrando = !!(filtroCliente || filtroExecutor);
  const doMes = validas.filter((o) => noMes(o.dataAgendada, mes)).sort(maisRecente);
  const porParte = Object.fromEntries(PARTES.map((p) => [p, doMes.filter((o) => situacao(o) === p)])) as Record<
    Parte,
    OrdemServico[]
  >;
  const totais = Object.fromEntries(PARTES.map((p) => [p, soma(porParte[p])])) as Record<Parte, number>;
  const total = soma(doMes);
  const mesAnterior = somarMeses(mes, -1);
  const totalAnterior = soma(validas.filter((o) => noMes(o.dataAgendada, mesAnterior)));

  // Concluído e ainda não pago, de qualquer mês, agrupado por cliente
  const emAberto = validas.filter((o) => situacao(o) === 'receber');
  const devedores = [
    ...emAberto
      .reduce((mapa, os) => {
        const atual = mapa.get(os.vinculoClienteId) ?? {
          chave: os.vinculoClienteId,
          nome: os.vinculoCliente.user.nome,
          valor: 0,
          qtd: 0,
          maisAntigo: os.dataAgendada,
        };
        atual.valor += valorDe(os);
        atual.qtd += 1;
        if (os.dataAgendada < atual.maisAntigo) atual.maisAntigo = os.dataAgendada;
        return mapa.set(os.vinculoClienteId, atual);
      }, new Map<string, Fatia & { maisAntigo: string }>())
      .values(),
  ].sort((a, b) => b.valor - a.valor);

  const ehMesAtual = mes.getTime() === inicioDoMes(new Date()).getTime();
  const visiveis = aba === 'todos' ? doMes : porParte[aba];

  // Só compara meses já fechados: o mês corrente ainda está pela metade
  function comparacao() {
    if (mes.getTime() >= inicioDoMes(new Date()).getTime()) return 'mês em andamento';
    const nomeAnterior = nomeMes(mesAnterior, false);
    if (!totalAnterior) return `nada lançado em ${nomeAnterior}`;
    const diferenca = Math.round(((total - totalAnterior) / totalAnterior) * 100);
    if (diferenca === 0) return `igual a ${nomeAnterior}`;
    return `${Math.abs(diferenca)}% ${diferenca > 0 ? 'a mais' : 'a menos'} que ${nomeAnterior}`;
  }

  function irPara(novo: Date) {
    setMes(novo);
    setAba('todos');
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Financeiro"
        descricao="O que já entrou, o que falta receber e o que está agendado, pela data do atendimento."
        acoes={
          <>
            {!ehMesAtual && (
              <Button variant="ghost" tamanho="sm" onClick={() => irPara(inicioDoMes(new Date()))}>
                Mês atual
              </Button>
            )}
            <div className="flex h-9 items-center rounded-lg border border-border-strong bg-panel px-0.5">
              <IconButton label="Mês anterior" onClick={() => irPara(somarMeses(mes, -1))}>
                <ChevronLeft size={17} />
              </IconButton>
              <span className="block min-w-[136px] px-1 text-center text-sm font-medium text-text first-letter:uppercase" aria-live="polite">
                {nomeMes(mes)}
              </span>
              <IconButton label="Próximo mês" onClick={() => irPara(somarMeses(mes, 1))}>
                <ChevronRight size={17} />
              </IconButton>
            </div>
          </>
        }
      />

      <div className="flex flex-wrap items-end gap-3" role="group" aria-label="Filtros">
        <label className="min-w-0 flex-1 basis-44 sm:max-w-64">
          <span className="rotulo">{termos.cliente.singular}</span>
          <select value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)} className="campo">
            <option value="">Todos</option>
            {clientesDoFiltro.map(([id, nome]) => (
              <option key={id} value={id}>
                {nome}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 flex-1 basis-44 sm:max-w-64">
          <span className="rotulo">{termos.executor.singular}</span>
          <select value={filtroExecutor} onChange={(e) => setFiltroExecutor(e.target.value)} className="campo">
            <option value="">Todos</option>
            {executoresDoFiltro.map(([id, nome]) => (
              <option key={id} value={id}>
                {nome}
              </option>
            ))}
          </select>
        </label>
        {filtrando && (
          <Button
            variant="ghost"
            tamanho="sm"
            className="mb-1"
            onClick={() => {
              setFiltroCliente('');
              setFiltroExecutor('');
            }}
          >
            <X size={14} />
            Limpar filtros
          </Button>
        )}
      </div>

      {isLoading ? (
        <>
          <div className="h-[188px] animate-pulse rounded-xl border border-border bg-panel" />
          <Skeleton linhas={5} />
        </>
      ) : (
        <>
          {/* Resumo do mês: o total e como ele se divide */}
          <section className="rounded-xl border border-border bg-panel p-5 shadow-card sm:p-6" aria-label="Resumo do mês">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
              <div>
                <p className="text-[13px] font-medium text-text-muted first-letter:uppercase">
                  Total de {nomeMes(mes, false)}
                  {filtrando && ' (filtrado)'}
                </p>
                <p className="num mt-1.5 text-[28px] font-semibold leading-none tracking-[-0.02em] text-text">
                  {formatarMoeda(total)}
                </p>
              </div>
              <p className="text-[13px] text-text-subtle">
                {quantos(doMes.length, termos.ordem)} · {comparacao()}
              </p>
            </div>

            <BarraDoMes totais={totais} total={total} />

            <ul className="mt-4 grid grid-cols-3 gap-x-3 sm:gap-x-6">
              {PARTES.map((p) => (
                <li key={p} className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[13px] text-text-muted">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-[3px] ${SITUACOES[p].cor}`} aria-hidden />
                    <span className="truncate">{SITUACOES[p].rotulo}</span>
                  </span>
                  <span className="num mt-0.5 block text-[15px] font-semibold leading-snug text-text sm:text-lg">
                    {formatarMoeda(totais[p])}
                  </span>
                  <span className="block text-xs text-text-subtle">
                    {quantos(porParte[p].length, termos.ordem)}
                    {total > 0 && ` · ${Math.round((totais[p] / total) * 100)}%`}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <GraficoMeses
            dados={ultimosMeses(mes, (m) => soma(validas.filter((o) => noMes(o.dataAgendada, m))))}
            selecionado={mes}
            onEscolher={irPara}
            titulo={filtrando ? 'Total por mês (filtrado)' : 'Total por mês'}
            formatar={(v) => formatarMoeda(v)}
          />

          <PagamentoEquipe
            ordensDoMes={todasValidas.filter((o) => noMes(o.dataAgendada, mes))}
            membros={membros ?? []}
            modelo={modeloRemuneracao}
            executorId={filtroExecutor}
            mes={mes}
            termos={termos}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="min-w-0">
              <SectionTitle>
                <span className="first-letter:uppercase">Lançamentos de {nomeMes(mes, false)}</span>
              </SectionTitle>
              {/* Linha de base desenhada por sombra: assim a rolagem horizontal no celular não corta a aba ativa */}
              <div
                role="tablist"
                aria-label="Filtrar lançamentos"
                className="mb-4 flex gap-5 overflow-x-auto overflow-y-hidden shadow-[inset_0_-1px_0_var(--line)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {(
                  [
                    ['todos', 'Todos', doMes.length],
                    ['receber', 'A receber', porParte.receber.length],
                    ['recebido', 'Recebidos', porParte.recebido.length],
                    ['previsto', 'Previstos', porParte.previsto.length],
                  ] as [Aba, string, number][]
                ).map(([valor, rotulo, qtd]) => (
                  <button
                    key={valor}
                    role="tab"
                    aria-selected={aba === valor}
                    onClick={() => setAba(valor)}
                    className={`flex shrink-0 items-center gap-2 border-b-2 px-0.5 pb-2.5 pt-1 text-sm font-medium transition-colors ${
                      aba === valor
                        ? 'border-primary text-primary-text'
                        : 'border-transparent text-text-muted hover:text-text'
                    }`}
                  >
                    {rotulo}
                    <span className="num rounded-md bg-surface px-1.5 text-xs text-text-muted">{qtd}</span>
                  </button>
                ))}
              </div>

              {visiveis.length ? (
                <ul className="overflow-hidden rounded-xl border border-border bg-panel shadow-card">
                  {visiveis.map((os) => (
                    <Lancamento
                      key={os.id}
                      os={os}
                      valor={valorDe(os)}
                      empresaId={empresaId}
                      onAbrir={() => navigate(`../ordens-servico/${os.id}`)}
                    />
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={Wallet}
                  title={
                    {
                      todos: `Nada lançado em ${nomeMes(mes, false)}`,
                      receber: `Nada a receber em ${nomeMes(mes, false)}`,
                      recebido: `Nenhum recebimento em ${nomeMes(mes, false)}`,
                      previsto: `Nada previsto para ${nomeMes(mes, false)}`,
                    }[aba]
                  }
                  description={
                    aba === 'todos'
                      ? `Os valores aparecem aqui assim que houver ${texto.min(termos.ordem, true)} no mês.`
                      : undefined
                  }
                />
              )}
            </section>

            <aside className="flex flex-col gap-6">
              <section>
                <SectionTitle>Em aberto</SectionTitle>
                <div className="overflow-hidden rounded-xl border border-border bg-panel shadow-card">
                  {devedores.length ? (
                    <>
                      <div className="border-b border-border px-4 py-3.5">
                        <p className="num text-lg font-semibold leading-snug text-text">{formatarMoeda(soma(emAberto))}</p>
                        <p className="text-xs text-text-subtle">
                          {quantos(emAberto.length, termos.ordem)} {texto.concluidos(termos.ordem)} sem pagamento, de
                          todos os meses
                        </p>
                      </div>
                      <ul>
                        {devedores.slice(0, 6).map((d) => (
                          <li key={d.chave} className="border-b border-border last:border-0">
                            <button
                              type="button"
                              onClick={() => {
                                setMes(inicioDoMes(new Date(d.maisAntigo)));
                                setAba('receber');
                              }}
                              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-text">{d.nome}</span>
                                <span className="block text-xs text-text-subtle">
                                  {quantos(d.qtd, termos.ordem)} · desde {diaCurto(d.maisAntigo)}
                                </span>
                              </span>
                              <span className="num shrink-0 text-sm font-semibold text-text">{formatarMoeda(d.valor)}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="flex items-start gap-2.5 px-4 py-4 text-[13px] text-text-muted">
                      <CircleCheck size={16} className="mt-px shrink-0 text-ok" />
                      Nada em aberto. Tudo o que foi concluído já foi recebido.
                    </p>
                  )}
                </div>
              </section>

              <Ranking titulo="Por serviço" fatias={agruparItens(doMes, 'servico', filtroExecutor)} total={total} />
              {!filtroExecutor && (
                <Ranking titulo={`Por ${texto.min(termos.executor)}`} fatias={agruparItens(doMes, 'executor')} total={total} />
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

// Pares [id, nome] sem repetição, em ordem alfabética
function unicos(pares: (readonly [string, string])[]) {
  return [...new Map(pares).entries()].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
}

const concluida = (os: OrdemServico) => os.status === 'FINALIZADO' || os.status === 'RECEBIDO';

// Quanto pagar a cada passeador no mês e o que sobra para a empresa.
// Comissão: a % de cada um sobre os passeios que ele concluiu. Salário: o valor fixo do mês.
function PagamentoEquipe({
  ordensDoMes,
  membros,
  modelo,
  executorId,
  mes,
  termos,
}: {
  ordensDoMes: OrdemServico[];
  membros: Membro[];
  modelo: ModeloRemuneracao;
  executorId: string;
  mes: Date;
  termos: EmpresaOutletContext['termos'];
}) {
  const comissao = modelo === 'COMISSAO';
  const concluidas = ordensDoMes.filter(concluida);
  const equipe = membros.filter((m) => m.papel === 'EXECUTOR' && (!executorId || m.id === executorId));
  if (!equipe.length) return null;

  const linhas = equipe
    .map((m) => {
      const itens = concluidas.flatMap((o) => o.itens.filter((i) => i.vinculoExecutorId === m.id));
      const faturado = itens.reduce((t, i) => t + Number(i.valor), 0);
      const definido = comissao ? m.comissaoPercentual : m.salarioMensal;
      const pagar = definido === null ? null : comissao ? (faturado * Number(definido)) / 100 : Number(definido);
      return { id: m.id, nome: m.user.nome, qtd: itens.length, faturado, definido, pagar };
    })
    .sort((a, b) => (b.pagar ?? 0) - (a.pagar ?? 0));

  const faturado = executorId
    ? linhas.reduce((t, l) => t + l.faturado, 0)
    : concluidas.reduce((t, o) => t + Number(o.valorTotal), 0);
  const totalPagar = linhas.reduce((t, l) => t + (l.pagar ?? 0), 0);
  const semValor = linhas.filter((l) => l.definido === null).length;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-panel shadow-card" aria-label="Pagamento da equipe">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-[15px] font-semibold text-text">Pagamento {executorId ? 'do' : 'da equipe'}{executorId ? ` ${texto.min(termos.executor)}` : ''}</h2>
          <p className="mt-0.5 text-[13px] text-text-muted">
            {MODELOS[modelo].titulo}
            {comissao
              ? ` · sobre ${texto.os(termos.ordem)} ${texto.concluidos(termos.ordem)} em ${nomeMes(mes, false)}`
              : ` · salário de ${nomeMes(mes, false)}`}
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-x-5 text-right sm:gap-x-8">
          <div>
            <dt className="text-xs text-text-subtle">{texto.concluidos(termos.ordem).replace(/^./, (c) => c.toUpperCase())}</dt>
            <dd className="num text-[15px] font-semibold text-text">{formatarMoeda(faturado)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-subtle">A pagar</dt>
            <dd className="num text-[15px] font-semibold text-text">{formatarMoeda(totalPagar)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-subtle">Fica para a empresa</dt>
            <dd className={`num text-[15px] font-semibold ${faturado - totalPagar < 0 ? 'text-danger' : 'text-ok'}`}>
              {formatarMoeda(faturado - totalPagar)}
            </dd>
          </div>
        </dl>
      </div>
      <ul>
        {linhas.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border px-5 py-3 last:border-0 sm:px-6">
            <span className="min-w-0 flex-1 basis-40">
              <span className="block truncate text-sm font-medium text-text">{l.nome}</span>
              <span className="block text-xs text-text-subtle">
                {l.qtd} {l.qtd === 1 ? texto.min(termos.ordem) : texto.min(termos.ordem, true)} ·{' '}
                {formatarMoeda(l.faturado)}
              </span>
            </span>
            <span className="text-[13px] text-text-muted">
              {l.definido === null
                ? comissao
                  ? 'Sem comissão definida'
                  : 'Sem salário definido'
                : comissao
                  ? `${Number(l.definido).toLocaleString('pt-BR')}% de comissão`
                  : 'Salário fixo'}
            </span>
            <span className={`num w-28 text-right text-sm font-semibold ${l.pagar === null ? 'text-text-subtle' : 'text-text'}`}>
              {l.pagar === null ? '—' : formatarMoeda(l.pagar)}
            </span>
          </li>
        ))}
      </ul>
      {semValor > 0 && (
        <p className="border-t border-border bg-surface/50 px-5 py-2.5 text-xs text-text-muted sm:px-6">
          {semValor === 1 ? `1 ${texto.min(termos.executor)} está` : `${semValor} ${texto.min(termos.executor, true)} estão`} sem{' '}
          {comissao ? 'comissão' : 'salário'} definido. Defina na tela Equipe.
        </p>
      )}
    </section>
  );
}

// Uma barra dividida nas três partes do mês, com 2px de respiro entre elas
function BarraDoMes({ totais, total }: { totais: Record<Parte, number>; total: number }) {
  const descricao = PARTES.map((p) => `${SITUACOES[p].rotulo}: ${formatarMoeda(totais[p])}`).join(', ');
  return (
    <div role="img" aria-label={descricao} className={`mt-5 flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full ${total ? '' : 'bg-surface'}`}>
      {PARTES.filter((p) => totais[p] > 0).map((p) => (
        <span
          key={p}
          title={`${SITUACOES[p].rotulo}: ${formatarMoeda(totais[p])}`}
          className={`h-full min-w-1 ${SITUACOES[p].cor}`}
          style={{ flex: `${totais[p]} 1 0%` }}
        />
      ))}
    </div>
  );
}

function Lancamento({
  os,
  valor,
  empresaId,
  onAbrir,
}: {
  os: OrdemServico;
  valor: number;
  empresaId: string;
  onAbrir: () => void;
}) {
  const [registrando, setRegistrando] = useState(false);
  const desfazer = useDesfazerRecebimento(empresaId, os);
  const s = situacao(os) as Parte;
  const executores = [...new Set(os.itens.map((i) => i.vinculoExecutor.user.nome.split(' ')[0]))].join(', ');
  const recebimento = descricaoRecebimento(os);

  function teclado(e: KeyboardEvent) {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAbrir();
    }
  }

  return (
    <li className="border-b border-border last:border-0">
      <div
        role="link"
        tabIndex={0}
        onClick={onAbrir}
        onKeyDown={teclado}
        className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-surface/70 focus-visible:bg-surface/70 sm:px-5 md:grid-cols-[64px_minmax(0,1fr)_minmax(0,140px)_96px_152px]"
      >
        <span className="hidden md:block">
          <span className="block text-[13px] font-semibold text-text">{diaCurto(os.dataAgendada)}</span>
          <span className="block text-xs text-text-subtle">{hora(os.dataAgendada)}</span>
        </span>

        <span className="order-1 min-w-0 md:order-none">
          <span className="block truncate text-sm font-medium text-text">{os.vinculoCliente.user.nome}</span>
          <span className="block truncate text-[13px] text-text-muted">
            {resumoServicos(os)}
            {executores && ` · ${executores}`}
          </span>
        </span>

        <span className="order-3 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 md:order-none md:block">
          <span className="text-xs text-text-subtle md:hidden">
            {diaCurto(os.dataAgendada)}, {hora(os.dataAgendada)}
          </span>
          <SituacaoBadge valor={s} />
          {recebimento && <span className="block truncate text-xs text-text-subtle md:mt-1">{recebimento}</span>}
        </span>

        <span className="num order-2 text-right text-sm font-semibold text-text md:order-none">
          {formatarMoeda(valor)}
        </span>

        <span
          className="order-4 flex justify-end md:order-none"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {s === 'recebido' ? (
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
          ) : (
            !registrando && (
              <Button
                variant="ghost"
                tamanho="sm"
                className="text-primary-text! hover:bg-primary-soft!"
                onClick={() => setRegistrando(true)}
              >
                <Check size={14} strokeWidth={2.5} />
                Marcar recebido
              </Button>
            )
          )}
        </span>
      </div>

      {registrando && (
        <div className="border-t border-border bg-surface/50 px-4 py-4 sm:px-5 md:pl-[104px]">
          <FormRecebimento os={os} empresaId={empresaId} onFechar={() => setRegistrando(false)} />
        </div>
      )}
    </li>
  );
}
