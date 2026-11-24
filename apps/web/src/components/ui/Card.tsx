import type { HTMLAttributes, ReactNode } from 'react';

export function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-xl border border-border bg-panel p-5 shadow-card ${className}`} {...props}>
      {children}
    </div>
  );
}

// Cabeçalho de página: título, descrição curta e ações à direita
export function PageHeader({
  titulo,
  descricao,
  acoes,
}: {
  titulo: ReactNode;
  descricao?: ReactNode;
  acoes?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-text sm:text-2xl">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-text-muted">{descricao}</p>}
      </div>
      {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
    </div>
  );
}

// Título de seção, com contagem opcional
export function SectionTitle({
  children,
  contagem,
  acao,
}: {
  children: ReactNode;
  contagem?: number;
  acao?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-text">
        {children}
        {contagem !== undefined && (
          <span className="num rounded-full bg-surface px-2 py-px text-xs font-medium text-text-muted">{contagem}</span>
        )}
      </h2>
      {acao}
    </div>
  );
}

export function Skeleton({ linhas = 4, className = '' }: { linhas?: number; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-panel ${className}`} aria-busy>
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border px-5 py-3.5 last:border-0">
          <div className="h-6 w-6 animate-pulse rounded-full bg-surface" />
          <div className="h-3 flex-1 animate-pulse rounded bg-surface" style={{ maxWidth: `${60 - i * 7}%` }} />
          <div className="h-5 w-20 animate-pulse rounded-full bg-surface" />
        </div>
      ))}
    </div>
  );
}
