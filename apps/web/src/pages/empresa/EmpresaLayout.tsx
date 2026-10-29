import { useQuery } from '@tanstack/react-query';
import { Briefcase, CalendarClock, ChevronLeft, LayoutDashboard, Settings2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { SegmentoModal } from '../../components/SegmentoModal';
import { api } from '../../lib/api';
import { aplicarTema, configSegmento, nomePapel, type ConfigSegmento } from '../../lib/segmentos';
import type { MinhaEmpresa, PapelVinculo, Segmento } from '../../types';

export interface EmpresaOutletContext {
  empresaId: string;
  vinculoId: string;
  papel: PapelVinculo;
  segmento: Segmento;
  termos: ConfigSegmento['termos'];
}

type Termos = ConfigSegmento['termos'];

const NAV_ITEMS = [
  { to: 'dashboard', label: () => 'Visão geral', icon: LayoutDashboard, papeis: ['ADMIN'] },
  {
    to: 'ordens-servico',
    label: (papel: PapelVinculo, termos: Termos) =>
      papel === 'CLIENTE' ? 'Histórico' : termos.ordem.plural,
    icon: CalendarClock,
    papeis: ['ADMIN', 'EXECUTOR', 'CLIENTE'],
  },
  { to: 'servicos', label: () => 'Serviços', icon: Briefcase, papeis: ['ADMIN', 'EXECUTOR', 'CLIENTE'] },
  { to: 'equipe', label: () => 'Equipe', icon: Users, papeis: ['ADMIN'] },
] satisfies {
  to: string;
  label: (papel: PapelVinculo, termos: Termos) => string;
  icon: typeof Briefcase;
  papeis: PapelVinculo[];
}[];

export function EmpresaLayout() {
  const { empresaId } = useParams<{ empresaId: string }>();
  const [segmentoModalAberto, setSegmentoModalAberto] = useState(false);
  const { data: empresas, isLoading } = useQuery({
    queryKey: ['minhas-empresas'],
    queryFn: async () => (await api.get<MinhaEmpresa[]>('/empresas')).data,
  });

  const atual = empresas?.find((e) => e.empresa.id === empresaId);
  const segmento = atual?.empresa.segmento ?? null;

  // O site inteiro assume a cor do ramo enquanto a pessoa está dentro da empresa
  useEffect(() => {
    aplicarTema(segmento);
    return () => aplicarTema(null);
  }, [segmento]);

  if (isLoading) {
    return <p className="text-text-muted">Carregando...</p>;
  }

  if (!atual) {
    return <p className="text-text-muted">Empresa não encontrada.</p>;
  }

  const config = configSegmento(atual.empresa.segmento);
  const navItems = NAV_ITEMS.filter((item) => item.papeis.includes(atual.papel));

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start">
      <aside className="flex shrink-0 flex-col gap-6 md:w-60">
        <div>
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-primary"
          >
            <ChevronLeft size={16} />
            Minhas empresas
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
              <config.icon size={22} strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold leading-tight text-text">
                {atual.empresa.nome}
              </h1>
              <span className="text-xs font-medium text-text-muted">
                {nomePapel(atual.empresa.segmento, atual.papel)}
              </span>
            </div>
          </div>
          {atual.papel === 'ADMIN' && (
            <button
              onClick={() => setSegmentoModalAberto(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-light px-2.5 py-1 text-xs font-medium text-primary-hover transition-opacity hover:opacity-80"
              title="Alterar ramo de atividade"
            >
              <Settings2 size={13} />
              {config.label}
            </button>
          )}
        </div>

        <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white shadow-[0_2px_8px_color-mix(in_srgb,var(--color-primary)_25%,transparent)]'
                    : 'text-text-muted hover:bg-surface hover:text-text'
                }`
              }
            >
              <item.icon size={18} strokeWidth={1.75} />
              {item.label(atual.papel, config.termos)}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <Outlet
          context={
            {
              empresaId: empresaId!,
              vinculoId: atual.vinculoId,
              papel: atual.papel,
              segmento: atual.empresa.segmento,
              termos: config.termos,
            } satisfies EmpresaOutletContext
          }
        />
      </div>

      {atual.papel === 'ADMIN' && segmentoModalAberto && (
        <SegmentoModal
          open={segmentoModalAberto}
          onClose={() => setSegmentoModalAberto(false)}
          empresaId={atual.empresa.id}
          segmentoAtual={atual.empresa.segmento}
        />
      )}
    </div>
  );
}
