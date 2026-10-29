import { useQuery } from '@tanstack/react-query';
import { Briefcase, CalendarClock, PlayCircle, Users } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/Badge';
import { api } from '../../lib/api';
import { formatarDataHora, formatarMoeda } from '../../lib/format';
import { texto } from '../../lib/segmentos';
import type { Membro, OrdemServico, Servico } from '../../types';
import type { EmpresaOutletContext } from './EmpresaLayout';

function ehHoje(iso: string) {
  const d = new Date(iso);
  const hoje = new Date();
  return (
    d.getFullYear() === hoje.getFullYear() &&
    d.getMonth() === hoje.getMonth() &&
    d.getDate() === hoje.getDate()
  );
}

export function EmpresaDashboardPage() {
  const { empresaId, termos } = useOutletContext<EmpresaOutletContext>();
  const navigate = useNavigate();

  const { data: servicos } = useQuery({
    queryKey: ['servicos', empresaId],
    queryFn: async () =>
      (
        await api.get<Servico[]>(`/empresas/${empresaId}/servicos`, {
          params: { incluirInativos: 'true' },
        })
      ).data,
  });

  const { data: membros } = useQuery({
    queryKey: ['membros', empresaId],
    queryFn: async () => (await api.get<Membro[]>(`/empresas/${empresaId}/membros`)).data,
  });

  const { data: ordens } = useQuery({
    queryKey: ['ordens-servico', empresaId],
    queryFn: async () =>
      (await api.get<OrdemServico[]>(`/empresas/${empresaId}/ordens-servico`)).data,
  });

  const servicosAtivos = servicos?.filter((s) => s.ativo).length ?? 0;
  const totalEquipe = membros?.filter((m) => m.papel !== 'ADMIN').length ?? 0;
  const emAndamento = ordens?.filter((o) => o.status === 'EXECUTANDO').length ?? 0;
  const agendadosHoje =
    ordens?.filter((o) => o.status === 'AGENDADO' && ehHoje(o.dataAgendada)).length ?? 0;

  const proximos = (ordens ?? [])
    .filter((o) => o.status === 'AGENDADO' || o.status === 'EXECUTANDO')
    .sort((a, b) => new Date(a.dataAgendada).getTime() - new Date(b.dataAgendada).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-text">Visão geral</h1>
        <p className="text-sm text-text-muted">O que está acontecendo na sua empresa</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Briefcase} cor="blue" valor={servicosAtivos} label="Serviços ativos" />
        <StatCard icon={Users} cor="violet" valor={totalEquipe} label="Pessoas na equipe" />
        <StatCard icon={PlayCircle} cor="amber" valor={emAndamento} label="Em andamento" />
        <StatCard icon={CalendarClock} cor="green" valor={agendadosHoje} label={`${termos.ordem.plural} hoje`} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-text-muted">{texto.proximos(termos.ordem)}</h2>
        {!proximos.length ? (
          <EmptyState
            icon={CalendarClock}
            title={`${texto.nenhum(termos.ordem)} ${texto.agendado(termos.ordem)}`}
            description={`Quando ${texto.um(termos.ordem)} for ${texto.agendado(termos.ordem)}, aparece aqui.`}
          />
        ) : (
          <Card className="divide-y divide-border p-0">
            {proximos.map((os) => (
              <button
                key={os.id}
                onClick={() => navigate(`ordens-servico/${os.id}`)}
                className="flex w-full flex-wrap items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-surface"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text">{os.vinculoCliente.user.nome}</p>
                  <p className="truncate text-sm text-text-muted">
                    {os.itens.map((i) => i.servico.nome).join(', ')}
                  </p>
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
      </div>
    </div>
  );
}
