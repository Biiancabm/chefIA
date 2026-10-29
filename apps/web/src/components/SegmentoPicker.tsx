import { Check } from 'lucide-react';
import { LISTA_SEGMENTOS, SEGMENTOS } from '../lib/segmentos';
import type { Segmento } from '../types';

// Grade de cartões para escolher o ramo de atividade da empresa
export function SegmentoPicker({
  value,
  onChange,
}: {
  value: Segmento | null;
  onChange: (segmento: Segmento) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {LISTA_SEGMENTOS.map((segmento) => {
        const config = SEGMENTOS[segmento];
        const selecionado = value === segmento;
        return (
          <button
            key={segmento}
            type="button"
            onClick={() => onChange(segmento)}
            className={`relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
              selecionado
                ? 'border-transparent ring-2'
                : 'border-border hover:border-text-subtle hover:bg-surface'
            }`}
            style={
              selecionado
                ? { backgroundColor: config.cores.light, ['--tw-ring-color' as string]: config.cores.primary }
                : undefined
            }
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: config.cores.primary }}
            >
              <config.icon size={18} strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text">{config.label}</p>
              <p className="text-xs leading-snug text-text-muted">{config.descricao}</p>
            </div>
            {selecionado && (
              <Check
                size={16}
                className="absolute right-2.5 top-2.5"
                style={{ color: config.cores.primary }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
