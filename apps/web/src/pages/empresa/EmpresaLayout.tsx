import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  CalendarClock,
  Check,
  ChevronsUpDown,
  ImageUp,
  LayoutGrid,
  LayoutDashboard,
  Settings2,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { EmpresaMarca } from '../../components/EmpresaMarca';
import { EmpresaModal } from '../../components/EmpresaModal';
import { AvisoInstalarApp } from '../../components/InstalarApp';
import { usePendencias } from '../../lib/pendencias';
import { LogoMarca } from '../../components/Logo';
import { useFecharFora, UserMenu } from '../../components/UserMenu';
import { api } from '../../lib/api';
import { configSegmento, nomePapel, texto, type ConfigSegmento } from '../../lib/segmentos';
import type { MinhaEmpresa, ModeloRemuneracao, PapelVinculo, Segmento } from '../../types';

export interface EmpresaOutletContext {
  empresaId: string;
  vinculoId: string;
  papel: PapelVinculo;
  segmento: Segmento;
  termos: ConfigSegmento['termos'];
  modeloRemuneracao: ModeloRemuneracao;
  // Cliente: o passeador que o atende (para quem ele pede passeios)
  responsavel: MinhaEmpresa['responsavel'];
  // Passeador: a comissão ou o salário dele
  remuneracao: MinhaEmpresa['remuneracao'];
}

type Termos = ConfigSegmento['termos'];

interface NavItem {
  to: string;
  label: (papel: PapelVinculo, termos: Termos) => string;
  curto?: string; // rótulo das abas do celular, quando o nome inteiro não cabe
  icon: LucideIcon;
  papeis: PapelVinculo[];
}

const NAV_ITEMS: NavItem[] = [
  { to: 'dashboard', label: () => 'Visão geral', curto: 'Início', icon: LayoutDashboard, papeis: ['ADMIN'] },
  {
    to: 'ordens-servico',
    label: (papel: PapelVinculo, termos: Termos) => (papel === 'CLIENTE' ? 'Histórico' : termos.ordem.plural),
    icon: CalendarClock,
    papeis: ['ADMIN', 'EXECUTOR', 'CLIENTE'],
  },
  { to: 'servicos', label: () => 'Serviços', icon: Briefcase, papeis: ['ADMIN', 'EXECUTOR', 'CLIENTE'] },
  { to: 'financeiro', label: () => 'Financeiro', icon: Wallet, papeis: ['ADMIN', 'EXECUTOR'] },
  { to: 'equipe', label: () => 'Equipe', icon: Users, papeis: ['ADMIN'] },
];

function Carregando() {
  return (
    <div className="flex h-dvh items-center justify-center">
      <span className="animate-pulse">
        <LogoMarca tamanho={36} />
      </span>
    </div>
  );
}

export function EmpresaLayout() {
  const { empresaId } = useParams<{ empresaId: string }>();
  const [dadosAberto, setDadosAberto] = useState(false);
  const { data: empresas, isLoading } = useQuery({
    queryKey: ['minhas-empresas'],
    queryFn: async () => (await api.get<MinhaEmpresa[]>('/empresas')).data,
  });

  const atual = empresas?.find((e) => e.empresa.id === empresaId);
  const pendencias = usePendencias(atual ? empresaId : undefined, atual?.papel);

  if (isLoading) return <Carregando />;

  if (!atual) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-xl font-semibold text-text">Empresa não encontrada</p>
        <p className="text-sm text-text-muted">Você não participa dessa empresa ou o link está errado.</p>
        <Link to="/" className="mt-2 text-sm font-medium text-primary-text underline-offset-4 hover:underline">
          Ver minhas empresas
        </Link>
      </div>
    );
  }

  const config = configSegmento(atual.empresa.segmento);
  const navItems: NavItem[] = NAV_ITEMS.filter((item) => item.papeis.includes(atual.papel));

  // Ramos com cadastro de quem recebe o cuidado ganham o menu "Pets", "Crianças"...
  const assistido = config.assistido;
  if (assistido) {
    navItems.splice(navItems.findIndex((i) => i.to === 'servicos'), 0, {
      to: 'assistidos',
      label: (papel) => (papel === 'CLIENTE' ? texto.meus(assistido.termo) : assistido.termo.plural),
      icon: assistido.icon,
      papeis: ['ADMIN', 'EXECUTOR', 'CLIENTE'],
    });
  }

  const ehAdmin = atual.papel === 'ADMIN';

  return (
    <div className="min-h-dvh bg-background md:pl-60">
      {/* Lateral (computador) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-panel md:flex">
        <div className="p-3">
          <TrocaEmpresa atual={atual} empresas={empresas ?? []} onEditar={ehAdmin ? () => setDadosAberto(true) : undefined} />
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2" aria-label="Seções da empresa">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-soft text-primary-text'
                    : 'text-text-muted hover:bg-surface hover:text-text'
                }`
              }
            >
              <item.icon size={17} strokeWidth={2} />
              <span className="min-w-0 flex-1 truncate">{item.label(atual.papel, config.termos)}</span>
              {!!pendencias[item.to] && (
                <span
                  className="num rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-[18px] text-white"
                  aria-label={`${pendencias[item.to]} esperando sua resposta`}
                >
                  {pendencias[item.to]}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-col gap-1 border-t border-border p-3">
          {ehAdmin && (
            <button
              onClick={() => setDadosAberto(true)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-text-muted transition-colors hover:bg-surface hover:text-text"
            >
              <Settings2 size={16} />
              <span className="min-w-0 flex-1 truncate">Dados da empresa</span>
            </button>
          )}
          <UserMenu acima />
        </div>
      </aside>

      {/* Barra superior (celular) */}
      <header className="sticky top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between gap-2 border-b border-border bg-panel/90 px-3 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
        <div className="min-w-0 flex-1">
          <TrocaEmpresa
            atual={atual}
            empresas={empresas ?? []}
            compacto
            onEditar={ehAdmin ? () => setDadosAberto(true) : undefined}
          />
        </div>
        {ehAdmin && (
          <button
            onClick={() => setDadosAberto(true)}
            aria-label="Dados da empresa"
            className="rounded-lg p-2 text-text-muted hover:bg-surface hover:text-text"
          >
            <Settings2 size={18} />
          </button>
        )}
        <UserMenu compacto />
      </header>

      <main className="w-full px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 md:pb-12 lg:px-8 lg:pt-7">
        <div className="mb-5 empty:hidden md:hidden">
          <AvisoInstalarApp />
        </div>
        <Outlet
          context={
            {
              empresaId: empresaId!,
              vinculoId: atual.vinculoId,
              papel: atual.papel,
              segmento: atual.empresa.segmento,
              termos: config.termos,
              modeloRemuneracao: atual.empresa.modeloRemuneracao,
              responsavel: atual.responsavel,
              remuneracao: atual.remuneracao,
            } satisfies EmpresaOutletContext
          }
        />
      </main>

      {/* Abas inferiores (celular): alcance do polegar */}
      <nav
        aria-label="Seções da empresa"
        className="fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-panel/95 px-1 pb-[calc(env(safe-area-inset-bottom)+4px)] pt-1 backdrop-blur md:hidden"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-primary-text' : 'text-text-subtle'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`relative flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                    isActive ? 'bg-primary-soft' : ''
                  }`}
                >
                  <item.icon size={18} strokeWidth={2} />
                  {!!pendencias[item.to] && (
                    <span
                      className="num absolute -top-1 right-1.5 min-w-[18px] rounded-full bg-primary px-1 text-center text-[10px] font-semibold leading-[18px] text-white ring-2 ring-panel"
                      aria-label={`${pendencias[item.to]} esperando sua resposta`}
                    >
                      {pendencias[item.to]}
                    </span>
                  )}
                </span>
                <span className="max-w-full truncate">{item.curto ?? item.label(atual.papel, config.termos)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {ehAdmin && dadosAberto && (
        <EmpresaModal open={dadosAberto} onClose={() => setDadosAberto(false)} empresa={atual.empresa} />
      )}
    </div>
  );
}

// Logo da empresa (ou ícone do ramo) + nome, abrindo a lista de empresas
function TrocaEmpresa({
  atual,
  empresas,
  compacto = false,
  onEditar,
}: {
  atual: MinhaEmpresa;
  empresas: MinhaEmpresa[];
  compacto?: boolean;
  onEditar?: () => void; // só o administrador edita logo e nome
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useFecharFora<HTMLDivElement>(aberto, () => setAberto(false));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="menu"
        className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-surface"
      >
        <EmpresaMarca empresa={atual.empresa} tamanho={compacto ? 32 : 36} forte />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-tight text-text">{atual.empresa.nome}</span>
          {!compacto && (
            <span className="block truncate text-xs text-text-subtle">
              {nomePapel(atual.empresa.segmento, atual.papel)}
            </span>
          )}
        </span>
        <ChevronsUpDown size={14} className="shrink-0 text-text-subtle" />
      </button>

      {aberto && (
        <div
          role="menu"
          className="absolute left-0 top-full z-40 mt-1.5 w-72 max-w-[calc(100vw-1.5rem)] animate-[surgir_140ms_cubic-bezier(0.16,1,0.3,1)] overflow-hidden rounded-xl border border-border bg-panel text-text shadow-overlay"
        >
          <p className="px-3.5 pb-1 pt-3 text-xs font-medium text-text-subtle">Suas empresas</p>
          <div className="p-1.5">
            {empresas.map(({ empresa, papel }) => {
              const ativa = empresa.id === atual.empresa.id;
              return (
                <Link
                  key={empresa.id}
                  to={`/empresas/${empresa.id}`}
                  role="menuitem"
                  onClick={() => setAberto(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface"
                >
                  <EmpresaMarca empresa={empresa} tamanho={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text">{empresa.nome}</span>
                    <span className="block truncate text-xs text-text-muted">{nomePapel(empresa.segmento, papel)}</span>
                  </span>
                  {ativa && <Check size={15} strokeWidth={2.5} className="shrink-0 text-primary-text" />}
                </Link>
              );
            })}
          </div>
          <div className="border-t border-border p-1.5">
            {onEditar && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAberto(false);
                  onEditar();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] font-medium text-text-muted transition-colors hover:bg-surface hover:text-text"
              >
                <ImageUp size={15} />
                {atual.empresa.logoUrl ? 'Trocar logo e dados' : 'Colocar a logo da empresa'}
              </button>
            )}
            <Link
              to="/"
              role="menuitem"
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-medium text-text-muted transition-colors hover:bg-surface hover:text-text"
            >
              <LayoutGrid size={15} />
              Todas as empresas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
