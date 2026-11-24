import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowRight, CalendarClock, CalendarDays, CircleAlert, Plus, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { AgendaLista, ehHoje } from '../../components/AgendaLista';
import { situacao } from '../../components/Recebimento';
import { Button } from '../../components/ui/Button';
import { PageHeader, SectionTitle, Skeleton } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { KpiStrip } from '../../components/ui/StatCard';
import { api } from '../../lib/api';
import { formatarMoeda } from '../../lib/format';
import { configSegmento, texto } from '../../lib/segmentos';
import type { Membro, OrdemServico, Servico } from '../../types';
import type { EmpresaOutletContext } from './EmpresaLayout';

const MS_DIA = 86_400_000;
const porData = (a: OrdemServico, b: OrdemServico) =>
  new Date(a.dataAgendada).getTime() - new Date(b.dataAgendada).getTime();

export function EmpresaDashboardPage() {
  const { empresaId, termos, segmento } = useOutletContext<EmpresaOutletContext>();
  const navigate = useNavigate();
  const configAssistido = configSegmento(segmento).assistido;

  const { data: servicos } = useQuery({
    queryKey: ['servicos', empresaId],
    queryFn: async () =>
      (await api.get<Servico[]>(`/empresas/${empresaId}/servicos`, { params: { incluirInativos: 'true' } })).data,
  });

  const { data: membros } = useQuery({
    queryKey: ['membros', empresaId],
    queryFn: async () => (await api.get<Membro[]>(`/empresas/${empresaId}/membros`)).data,
  });

  const { data: ordens, isLoading } = useQuery({
    queryKey: ['ordens-servico', empresaId],
    queryFn: async () => (await api.get<OrdemServico[]>(`/empresas/${empresaId}/ordens-servico`)).data,
  });

  const lista = ordens ?? [];
  const agora = Date.now();
  const deHoje = lista.filter((o) => ehHoje(o.dataAgendada)).sort(porData);
  const emAndamento = lista.filter((o) => o.status === 'EXECUTANDO').length;
  const proximos7 = lista.filter((o) => {
    const t = new Date(o.dataAgendada).getTime();
    return o.status === 'AGENDADO' && t > agora && t - agora <= 7 * MS_DIA;
  }).length;
  const valor30 = lista
    .filter((o) => o.status === 'FINALIZADO' && agora - new Date(o.dataAgendada).getTime() <= 30 * MS_DIA)
    .reduce((soma, o) => soma + Number(o.valorTotal), 0);
  const concluidosHoje = deHoje.filter((o) => o.status === 'FINALIZADO').length;
  const aReceber = lista.filter((o) => situacao(o) === 'receber').reduce((soma, o) => soma + Number(o.valorTotal), 0);

  const proximos = lista
    .filter((o) => (o.status === 'AGENDADO' || o.status === 'EXECUTANDO') && !ehHoje(o.dataAgendada))
    .filter((o) => new Date(o.dataAgendada).getTime() > agora)
    .sort(porData)
    .slice(0, 6);

  const servicosAtivos = servicos?.filter((s) => s.ativo && s.aprovado).length ?? 0;
  const executores = membros?.filter((m) => m.papel === 'EXECUTOR').length ?? 0;
  const clientes = membros?.filter((m) => m.papel === 'CLIENTE') ?? [];
  const semResponsavel = clientes.filter((c) => !c.vinculoResponsavelId).length;

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Visão geral"
        descricao={<span className="inline-block first-letter:uppercase">{hoje}</span>}
        acoes={
          <Button onClick={() => navigate('../ordens-servico?novo=1')}>
            <Plus size={16} />
            {texto.novo(termos.ordem)}
          </Button>
        }
      />

      <KpiStrip
        itens={[
          {
            label: `${termos.ordem.plural} hoje`,
            valor: deHoje.filter((o) => o.status !== 'CANCELADO').length,
            nota: `${concluidosHoje} ${concluidosHoje === 1 ? texto.concluido(termos.ordem) : texto.concluidos(termos.ordem)}`,
            icon: CalendarClock,
            destaque: true,
          },
          { label: 'Em andamento', valor: emAndamento, nota: 'acontecendo agora', icon: Activity },
          {
            label: 'Próximos 7 dias',
            valor: proximos7,
            nota: `${texto.min(termos.ordem, true)} ${texto.agendado(termos.ordem)}s`,
            icon: CalendarDays,
          },
          { label: 'Finalizado em 30 dias', valor: formatarMoeda(valor30), nota: 'soma dos valores', icon: Wallet },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section>
            <SectionTitle
              contagem={deHoje.length}
              acao={
                <Link
                  to="../ordens-servico"
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-primary-text hover:underline"
                >
                  Ver todos <ArrowRight size={14} />
                </Link>
              }
            >
              Agenda de hoje
            </SectionTitle>
            {isLoading ? (
              <Skeleton linhas={4} />
            ) : deHoje.length ? (
              <AgendaLista ordens={deHoje} cabecalhoDia={false} onAbrir={(id) => navigate(`../ordens-servico/${id}`)} />
            ) : (
              <EmptyState
                icon={CalendarClock}
                title={`${texto.nenhum(termos.ordem)} para hoje`}
                description={`Agende ${texto.um(termos.ordem)} e ${termos.executor.plural.toLowerCase()} recebem na lista deles.`}
              />
            )}
          </section>

          {!!proximos.length && (
            <section>
              <SectionTitle>Próximos dias</SectionTitle>
              <AgendaLista ordens={proximos} onAbrir={(id) => navigate(`../ordens-servico/${id}`)} />
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-3">
          <SectionTitle>Empresa</SectionTitle>
          <div className="overflow-hidden rounded-xl border border-border bg-panel shadow-card">
            <Atalho to="../financeiro" rotulo="A receber" valor={formatarMoeda(aReceber)} />
            <Atalho to="../servicos" rotulo="Serviços ativos" valor={servicosAtivos} />
            <Atalho to="../equipe" rotulo={termos.executor.plural} valor={executores} />
            <Atalho to="../equipe" rotulo={termos.cliente.plural} valor={clientes.length} />
            {configAssistido && <Atalho to="../assistidos" rotulo={configAssistido.termo.plural} valor="Ver" />}
          </div>
          {semResponsavel > 0 && (
            <Link
              to="../equipe"
              className="flex gap-2.5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-[13px] leading-snug text-danger transition-colors hover:border-danger/60"
            >
              <CircleAlert size={16} className="mt-px shrink-0" />
              <span>
                <span className="font-semibold">
                  {semResponsavel} {texto.min(termos.cliente, semResponsavel > 1)} sem responsável.
                </span>{' '}
                Defina quem atende em Equipe.
              </span>
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}

function Atalho({ to, rotulo, valor }: { to: string; rotulo: string; valor: ReactNode }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm transition-colors last:border-0 hover:bg-surface"
    >
      <span className="text-text-muted group-hover:text-text">{rotulo}</span>
      <span className="flex items-center gap-2">
        <span className="num font-semibold text-text">{valor}</span>
        <ArrowRight size={14} className="text-text-subtle transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
