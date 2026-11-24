import { Bell, Info } from 'lucide-react';
import { useState } from 'react';
import type { ConfigAssistido } from '../lib/segmentos';
import type { Assistido } from '../types';

// Foto redonda, ou o ícone do ramo quando não tem foto
export function FotoAssistido({
  assistido,
  config,
  tamanho = 56,
}: {
  assistido: Pick<Assistido, 'nome' | 'fotoUrl'>;
  config: ConfigAssistido;
  tamanho?: number;
}) {
  const [falhou, setFalhou] = useState(false);
  if (assistido.fotoUrl && !falhou) {
    return (
      <img
        src={assistido.fotoUrl}
        alt={assistido.nome}
        onError={() => setFalhou(true)}
        className="shrink-0 rounded-full border border-border object-cover"
        style={{ width: tamanho, height: tamanho }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-text"
      style={{ width: tamanho, height: tamanho }}
    >
      <config.icon size={Math.round(tamanho * 0.44)} strokeWidth={1.6} />
    </div>
  );
}

// "Informações importantes" e "Lembretes", usado no cartão e no briefing do atendimento
export function ListasBriefing({
  assistido,
  compacto = false,
}: {
  assistido: Pick<Assistido, 'informacoes' | 'lembretes'>;
  compacto?: boolean;
}) {
  if (!assistido.informacoes.length && !assistido.lembretes.length) {
    return compacto ? null : <p className="text-sm text-text-subtle">Nenhuma informação ou lembrete cadastrado.</p>;
  }
  return (
    <div className={`grid gap-4 ${compacto ? '' : 'sm:grid-cols-2'}`}>
      {!!assistido.informacoes.length && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-muted">
            <Info size={13} /> Informações importantes
          </p>
          <ul className="flex flex-col gap-1 text-sm leading-snug text-text">
            {assistido.informacoes.map((info, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-text-subtle" />
                {info}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!!assistido.lembretes.length && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-muted">
            <Bell size={13} /> Lembretes
          </p>
          <ul className="flex flex-col gap-1 text-sm leading-snug text-text">
            {assistido.lembretes.map((lembrete, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {lembrete}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
