import { ChevronsUpDown, LogOut, Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { useTema, type PreferenciaTema } from '../lib/tema';
import { ItemInstalarApp } from './InstalarApp';
import { Avatar } from './ui/Avatar';

const OPCOES_TEMA: { valor: PreferenciaTema; label: string; icon: LucideIcon }[] = [
  { valor: 'claro', label: 'Claro', icon: Sun },
  { valor: 'escuro', label: 'Escuro', icon: Moon },
  { valor: 'sistema', label: 'Sistema', icon: Monitor },
];

// Fecha um menu ao clicar fora ou apertar Esc
export function useFecharFora<T extends HTMLElement>(aberto: boolean, fechar: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!aberto) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) fechar();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') fechar();
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [aberto, fechar]);
  return ref;
}

// Escolha de tema em três botões (claro, escuro, sistema)
export function SeletorTema() {
  const { preferencia, setPreferencia } = useTema();
  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-0.5 rounded-md bg-surface p-0.5">
      {OPCOES_TEMA.map(({ valor, label, icon: Icone }) => {
        const ativo = preferencia === valor;
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => setPreferencia(valor)}
            className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              ativo ? 'bg-panel text-text shadow-[0_1px_2px_rgb(25_20_45/0.12)]' : 'text-text-muted hover:text-text'
            }`}
          >
            <Icone size={13} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// Botão com o nome da pessoa que abre: email, tema e sair.
// "compacto" mostra só o avatar (barra do celular); "acima" abre o menu para cima (rodapé da lateral)
export function UserMenu({ compacto = false, acima = false }: { compacto?: boolean; acima?: boolean }) {
  const { user, sair } = useAuth();
  const [aberto, setAberto] = useState(false);
  const ref = useFecharFora<HTMLDivElement>(aberto, () => setAberto(false));
  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="menu"
        aria-label={compacto ? 'Conta e tema' : undefined}
        className={`flex items-center gap-2.5 rounded-lg text-left transition-colors hover:bg-surface ${
          compacto ? 'p-1' : 'w-full px-2 py-1.5'
        }`}
      >
        <Avatar nome={user.nome} size={compacto ? 30 : 28} />
        {!compacto && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-text">{user.nome}</span>
              <span className="block truncate text-xs text-text-subtle">{user.email}</span>
            </span>
            <ChevronsUpDown size={14} className="shrink-0 text-text-subtle" />
          </>
        )}
      </button>

      {aberto && (
        <div
          role="menu"
          className={`absolute z-40 w-64 animate-[surgir_140ms_cubic-bezier(0.16,1,0.3,1)] overflow-hidden rounded-xl border border-border bg-panel text-text shadow-overlay ${
            acima ? 'bottom-full left-0 mb-2' : 'right-0 top-full mt-2'
          }`}
        >
          <div className="border-b border-border px-3.5 py-3">
            <p className="truncate text-sm font-semibold">{user.nome}</p>
            <p className="truncate text-xs text-text-muted">{user.email}</p>
          </div>
          <div className="px-2.5 py-2.5">
            <p className="mb-1.5 px-0.5 text-xs font-medium text-text-muted">Tema</p>
            <SeletorTema />
          </div>
          <div className="border-t border-border p-1.5">
            <ItemInstalarApp />
            <button
              type="button"
              role="menuitem"
              onClick={sair}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-text-muted transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <LogOut size={15} />
              Sair da conta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

