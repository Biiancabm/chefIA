import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface Kpi {
  label: string;
  valor: ReactNode;
  nota?: ReactNode;
  icon: LucideIcon;
  destaque?: boolean; // o número que importa agora ganha a cor da marca
}

export function KpiStrip({ itens }: { itens: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {itens.map((kpi) => (
        <div
          key={kpi.label}
          className={`flex flex-col gap-3 rounded-xl border p-4 ${
            kpi.destaque ? 'border-primary bg-primary text-white' : 'border-border bg-panel shadow-card'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[13px] font-medium ${kpi.destaque ? 'text-white/85' : 'text-text-muted'}`}>
              {kpi.label}
            </span>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                kpi.destaque ? 'bg-white/15 text-white' : 'bg-primary-soft text-primary-text'
              }`}
            >
              <kpi.icon size={15} strokeWidth={2} />
            </span>
          </div>
          <div>
            <span className="num block text-[28px] font-semibold leading-none tracking-[-0.02em]">{kpi.valor}</span>
            {kpi.nota && (
              <span className={`mt-1.5 block text-xs ${kpi.destaque ? 'text-white/80' : 'text-text-subtle'}`}>
                {kpi.nota}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
