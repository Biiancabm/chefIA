import { iniciais } from '../../lib/format';

export function Avatar({ nome, size = 32 }: { nome: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 select-none items-center justify-center rounded-full bg-primary-soft font-semibold text-primary-text"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden
    >
      {iniciais(nome)}
    </div>
  );
}
