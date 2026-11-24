import { Check, Percent, Wallet, type LucideIcon } from 'lucide-react';
import type { ModeloRemuneracao } from '../types';

export const MODELOS: Record<ModeloRemuneracao, { titulo: string; resumo: string; explicacao: string; icon: LucideIcon }> = {
  COMISSAO: {
    titulo: 'Comissão por passeio',
    resumo: 'Cada passeador recebe uma porcentagem do valor dos passeios que fez.',
    explicacao:
      'Exemplo: com 40% de comissão, um passeio de R$ 50 rende R$ 20 ao passeador e R$ 30 à empresa. O Financeiro calcula quanto pagar a cada um pelos passeios concluídos no mês.',
    icon: Percent,
  },
  SALARIO: {
    titulo: 'Salário fixo',
    resumo: 'Cada passeador recebe um valor fixo por mês, faça quantos passeios fizer.',
    explicacao:
      'Exemplo: com salário de R$ 1.800, o passeador recebe isso no mês e o restante do faturamento fica com a empresa. O Financeiro soma a folha do mês e mostra o que sobra.',
    icon: Wallet,
  },
};

// Escolha de como a empresa paga os passeadores, com a explicação de cada modelo
export function RemuneracaoPicker({
  value,
  onChange,
}: {
  value: ModeloRemuneracao;
  onChange: (modelo: ModeloRemuneracao) => void;
}) {
  return (
    <div>
      <div role="radiogroup" aria-label="Como os passeadores são pagos" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {(Object.keys(MODELOS) as ModeloRemuneracao[]).map((modelo) => {
          const config = MODELOS[modelo];
          const selecionado = value === modelo;
          return (
            <button
              key={modelo}
              type="button"
              role="radio"
              aria-checked={selecionado}
              onClick={() => onChange(modelo)}
              className={`relative flex items-start gap-3 rounded-lg border bg-panel p-3 text-left transition-[border-color,box-shadow,background-color] duration-150 ${
                selecionado
                  ? 'border-primary bg-primary-soft shadow-[0_0_0_1px_var(--primary)]'
                  : 'border-border hover:border-border-strong hover:bg-surface/60'
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  selecionado ? 'bg-primary text-white' : 'bg-primary-soft text-primary-text'
                }`}
              >
                <config.icon size={16} strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1 pr-5">
                <span className="block text-sm font-medium text-text">{config.titulo}</span>
                <span className="block text-xs leading-snug text-text-muted">{config.resumo}</span>
              </span>
              {selecionado && (
                <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2.5 rounded-lg bg-surface px-3.5 py-2.5 text-[13px] leading-relaxed text-text-muted">
        {MODELOS[value].explicacao} O valor de cada passeador (a porcentagem ou o salário) é definido na tela Equipe.
      </p>
    </div>
  );
}
