import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Info, Wallet } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { hora } from '../../components/AgendaLista';
import { GraficoMeses, Ranking, ultimosMeses, type Fatia } from '../../components/GraficosFinanceiro';
import { MODELOS } from '../../components/RemuneracaoPicker';
import { StatusBadge } from '../../components/ui/Badge';
import { Button, IconButton } from '../../components/ui/Button';
import { PageHeader, SectionTitle, Skeleton } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { api } from '../../lib/api';
import { formatarMoeda } from '../../lib/format';
import { texto } from '../../lib/segmentos';
import type { OrdemServico, OrdemServicoItem } from '../../types';
import type { EmpresaOutletContext } from './EmpresaLayout';

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

const CONCLUIDO = ['FINALIZADO', 'RECEBIDO'];
const PREVISTO = ['AGENDADO', 'EXECUTANDO'];

interface Linha {
  os: OrdemServico;
  item: OrdemServicoItem;
  concluido: boolean;
}

// Financeiro do passeador: quanto ele ganha no mês com os passeios que fez (comissão)
// ou o salário fixo, e a lista dos passeios do mês. Pedidos ainda não aceitos,
// cancelados e recusados ficam de fora.
export function MeuFinanceiroPage() {
  const { empresaId, vinculoId, termos, modeloRemuneracao, remuneracao } = useOutletContext<EmpresaOutletContext>();
  const navigate = useNavigate();
  const [mes, setMes] = useState(() => inicioDoMes(new Date()));
  const comissao = modeloRemuneracao === 'COMISSAO';
  const percentual = remuneracao?.comissaoPercentual === null || !remuneracao ? null : Number(remuneracao.comissaoPercentual);
  const salario = remuneracao?.salarioMensal === null || !remuneracao ? null : Number(remuneracao.salarioMensal);
  const definido = comissao ? percentual !== null : salario !== null;

  const { data: ordens, isLoading } = useQuery({
    queryKey: ['ordens-servico', empresaId],
    queryFn: async () => (await api.get<OrdemServico[]>(`/empresas/${empresaId}/ordens-servico`)).data,
  });

  // Só os serviços que eu fiz (uma OS pode ter itens de outros passeadores)
  const linhas: Linha[] = (ordens ?? [])
    .filter((os) => noMes(os.dataAgendada, mes) && [...CONCLUIDO, ...PREVISTO].includes(os.status))
    .flatMap((os) =>
      os.itens
        .filter((item) => item.vinculoExecutorId === vinculoId)
        .map((item) => ({ os, item, concluido: CONCLUIDO.includes(os.status) })),
    )
    .sort((a, b) => new Date(b.os.dataAgendada).getTime() - new Date(a.os.dataAgendada).getTime());

  const feitos = linhas.filter((l) => l.concluido);
  const previstos = linhas.filter((l) => !l.concluido);
  const somar = (lista: Linha[]) => lista.reduce((t, l) => t + Number(l.item.valor), 0);
  const ganhoDe = (valor: number) => (percentual === null ? 0 : (valor * percentual) / 100);

  // Últimos 6 meses até o mês escolhido, para o gráfico.
  // Comissão: quanto ganhou (ou o valor dos passeios, se a comissão não foi definida).
  // Salário: o salário é igual todo mês, então o gráfico mostra quantos passeios fez.
  const metrica: 'ganho' | 'valor' | 'quantidade' = !comissao ? 'quantidade' : definido ? 'ganho' : 'valor';
  const historico = ultimosMeses(mes, (m) => {
    const meus = (ordens ?? [])
      .filter((os) => noMes(os.dataAgendada, m) && CONCLUIDO.includes(os.status))
      .flatMap((os) => os.itens.filter((item) => item.vinculoExecutorId === vinculoId));
    const valor = meus.reduce((t, item) => t + Number(item.valor), 0);
    return metrica === 'quantidade' ? meus.length : metrica === 'ganho' ? ganhoDe(valor) : valor;
  });

  // Por serviço, como no financeiro do admin: o que cada serviço rendeu a você no mês
  const valorParaMim = (valor: number) => (comissao && definido ? ganhoDe(valor) : valor);
  const porServico: Fatia[] = [
    ...feitos
      .reduce((mapa, l) => {
        const atual = mapa.get(l.item.servicoId) ?? { chave: l.item.servicoId, nome: l.item.servico.nome, valor: 0, qtd: 0 };
        atual.valor += valorParaMim(Number(l.item.valor));
        atual.qtd += 1;
        return mapa.set(l.item.servicoId, atual);
      }, new Map<string, Fatia>())
      .values(),
  ].sort((a, b) => b.valor - a.valor);
  const totalPorServico = porServico.reduce((t, f) => t + f.valor, 0);

  const faturadoFeito = somar(feitos);
  const faturadoPrevisto = somar(previstos);
  const ganho = comissao ? ganhoDe(faturadoFeito) : (salario ?? 0);
  const ganhoPrevisto = comissao ? ganhoDe(faturadoPrevisto) : 0;
  const ehMesAtual = mes.getTime() === inicioDoMes(new Date()).getTime();
  const passeios = (n: number) => `${n} ${texto.min(termos.ordem, n !== 1)}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Financeiro"
        descricao={`Quanto você ganha com ${texto.os(termos.ordem)}, mês a mês.`}
        acoes={
          <>
            {!ehMesAtual && (
              <Button variant="ghost" tamanho="sm" onClick={() => setMes(inicioDoMes(new Date()))}>
                Mês atual
              </Button>
            )}
            <div className="flex h-9 items-center rounded-lg border border-border-strong bg-panel px-0.5">
              <IconButton label="Mês anterior" onClick={() => setMes(somarMeses(mes, -1))}>
                <ChevronLeft size={17} />
              </IconButton>
              <span
                className="block min-w-[136px] px-1 text-center text-sm font-medium text-text first-letter:uppercase"
                aria-live="polite"
              >
                {nomeMes(mes)}
              </span>
              <IconButton label="Próximo mês" onClick={() => setMes(somarMeses(mes, 1))}>
                <ChevronRight size={17} />
              </IconButton>
            </div>
          </>
        }
      />

      {!definido && (
        <p className="flex items-start gap-2.5 rounded-xl border border-dashed border-border-strong px-4 py-3 text-[13px] text-text-muted">
          <Info size={16} className="mt-px shrink-0" />
          {comissao
            ? 'A empresa ainda não definiu a sua comissão. Os valores ganhos aparecem aqui assim que ela definir.'
            : 'A empresa ainda não definiu o seu salário. Ele aparece aqui assim que ela definir.'}
        </p>
      )}

      {isLoading ? (
        <>
          <div className="h-[156px] animate-pulse rounded-xl border border-border bg-panel" />
          <Skeleton linhas={4} />
        </>
      ) : (
        <>
          <section className="rounded-xl border border-border bg-panel p-5 shadow-card sm:p-6" aria-label="Resumo do mês">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
              <div>
                <p className="text-[13px] font-medium text-text-muted first-letter:uppercase">
                  Você ganha em {nomeMes(mes, false)}
                </p>
                <p className="num mt-1.5 text-[28px] font-semibold leading-none tracking-[-0.02em] text-text">
                  {definido ? formatarMoeda(ganho) : '—'}
                </p>
                <p className="mt-2 text-[13px] text-text-subtle">
                  {comissao
                    ? `${percentual !== null ? `${percentual.toLocaleString('pt-BR')}% de comissão` : MODELOS.COMISSAO.titulo} sobre ${passeios(feitos.length)} ${texto.concluidos(termos.ordem)} (${formatarMoeda(faturadoFeito)})`
                    : `${MODELOS.SALARIO.titulo} · ${passeios(feitos.length)} ${texto.concluidos(termos.ordem)} no mês`}
                </p>
              </div>

              {comissao && previstos.length > 0 && (
                <div className="sm:text-right">
                  <p className="text-[13px] text-text-muted">Ainda pode ganhar</p>
                  <p className="num mt-1 text-lg font-semibold text-text">
                    {definido ? formatarMoeda(ganhoPrevisto) : '—'}
                  </p>
                  <p className="text-xs text-text-subtle">
                    com {passeios(previstos.length)} {texto.agendado(termos.ordem)}
                    {previstos.length === 1 ? '' : 's'}
                  </p>
                </div>
              )}
            </div>
          </section>

          <GraficoMeses
            dados={historico}
            selecionado={mes}
            onEscolher={setMes}
            titulo={
              metrica === 'ganho'
                ? 'Quanto você ganhou por mês'
                : metrica === 'valor'
                  ? `Valor d${texto.os(termos.ordem)} ${texto.concluidos(termos.ordem)} por mês`
                  : `${termos.ordem.plural} ${texto.concluidos(termos.ordem)} por mês`
            }
            formatar={metrica === 'quantidade' ? (v) => passeios(v) : (v) => formatarMoeda(v)}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0">
            <SectionTitle contagem={linhas.length}>
              <span className="first-letter:uppercase">
                {termos.ordem.plural} de {nomeMes(mes, false)}
              </span>
            </SectionTitle>
            {linhas.length ? (
              <ul className="overflow-hidden rounded-xl border border-border bg-panel shadow-card">
                {linhas.map((l) => (
                  <LinhaPasseio
                    key={l.item.id}
                    linha={l}
                    ganho={comissao && definido ? ganhoDe(Number(l.item.valor)) : null}
                    onAbrir={() => navigate(`../ordens-servico/${l.os.id}`)}
                  />
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Wallet}
                title={`${texto.nenhum(termos.ordem)} em ${nomeMes(mes, false)}`}
                description={`Quando você fizer ${texto.um(termos.ordem)}, o valor aparece aqui.`}
              />
            )}
          </section>

          <aside>
            <Ranking
              titulo={comissao && definido ? 'Quanto ganhou por serviço' : 'Por serviço'}
              fatias={porServico}
              total={totalPorServico}
            />
          </aside>
          </div>
        </>
      )}
    </div>
  );
}

function LinhaPasseio({ linha, ganho, onAbrir }: { linha: Linha; ganho: number | null; onAbrir: () => void }) {
  const { os, item, concluido } = linha;

  function teclado(e: KeyboardEvent) {
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
        className="grid cursor-pointer grid-cols-[60px_minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-3 transition-colors hover:bg-surface/70 focus-visible:bg-surface/70 sm:px-5"
      >
        <span>
          <span className="block whitespace-nowrap text-[13px] font-semibold text-text">{diaCurto(os.dataAgendada)}</span>
          <span className="block text-xs text-text-subtle">{hora(os.dataAgendada)}</span>
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-text">
            {os.assistido ? `${os.assistido.nome} · ` : ''}
            {item.servico.nome}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-text-muted">
            <span className="truncate">{os.vinculoCliente.user.nome}</span>
            {!concluido && <StatusBadge status={os.status} />}
          </span>
        </span>
        <span className="text-right">
          <span className={`num block text-sm font-semibold ${concluido ? 'text-text' : 'text-text-muted'}`}>
            {ganho !== null ? formatarMoeda(ganho) : formatarMoeda(item.valor)}
          </span>
          {ganho !== null && <span className="num block text-xs text-text-subtle">de {formatarMoeda(item.valor)}</span>}
        </span>
      </div>
    </li>
  );
}
