import { CalendarClock, Check, CircleAlert, ClipboardCheck, Moon, Sun, UsersRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTema } from '../lib/tema';
import { Logo } from './Logo';

const PONTOS = [
  { icon: CalendarClock, texto: 'Agenda de atendimentos da equipe' },
  { icon: ClipboardCheck, texto: 'Relatório ao final de cada atendimento' },
  { icon: UsersRound, texto: 'Acesso próprio para equipe e clientes' },
];

// Moldura das telas de conta (login, cadastro, senha): painel da marca à esquerda, formulário à direita.
// Ocupa a tela inteira em qualquer tamanho.
export function AuthLayout({
  titulo,
  subtitulo,
  children,
  rodape,
  topo,
}: {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
  rodape?: ReactNode;
  topo?: ReactNode; // canto superior direito (ex.: "Criar conta")
}) {
  return (
    <div className="grid min-h-dvh w-full bg-panel lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Painel da marca (computador) */}
      <aside className="relative hidden flex-col justify-between bg-primary-strong p-10 text-white lg:flex xl:p-14">
        <Link to="/login" aria-label="easyService" className="self-start">
          <Logo tamanho={30} claro />
        </Link>

        <div className="max-w-md">
          <p className="text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] xl:text-4xl">
            Do agendamento ao relatório, num só lugar.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-white/75">
            Quem agenda organiza o dia, quem executa registra cada atendimento e o cliente acompanha tudo.
          </p>
          <ul className="mt-8 flex flex-col gap-3">
            {PONTOS.map(({ icon: Icone, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-sm text-white/90">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icone size={16} />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/55">easyService · gestão para negócios de pets</p>
      </aside>

      {/* Formulário */}
      <div className="flex min-h-dvh flex-col px-5 py-5 sm:px-10">
        <div className="flex h-10 items-center justify-between gap-4">
          <Link to="/login" aria-label="easyService" className="lg:invisible">
            <Logo tamanho={26} />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {topo}
            <AlternarTema />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[380px] animate-[surgir_240ms_cubic-bezier(0.16,1,0.3,1)]">
            <h1 className="text-2xl font-semibold tracking-[-0.015em] text-text">{titulo}</h1>
            <p className="mb-7 mt-1.5 text-sm leading-relaxed text-text-muted">{subtitulo}</p>
            {children}
            {rodape && <div className="mt-6 text-sm text-text-muted">{rodape}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Caixa de erro dos formulários de conta
export function Erro({ texto }: { texto: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger"
    >
      <CircleAlert size={16} className="mt-0.5 shrink-0" />
      {texto}
    </div>
  );
}

// Aviso de sucesso dos formulários de conta
export function Sucesso({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="flex gap-3 rounded-lg border border-ok/25 bg-ok-soft p-4 text-sm text-text">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ok text-white dark:text-[#12261b]">
        <Check size={12} strokeWidth={3} />
      </span>
      <div>{children}</div>
    </div>
  );
}

function AlternarTema() {
  const { preferencia, setPreferencia } = useTema();
  const escuro =
    preferencia === 'escuro' ||
    (preferencia === 'sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  return (
    <button
      type="button"
      onClick={() => setPreferencia(escuro ? 'claro' : 'escuro')}
      aria-label={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
      title={escuro ? 'Tema claro' : 'Tema escuro'}
      className="rounded-lg border border-border p-2 text-text-muted transition-colors hover:bg-surface hover:text-text"
    >
      {escuro ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
