import { iniciais } from '../../lib/format';

const PALETA = [
  'bg-blue-50 text-blue-700',
  'bg-teal-50 text-teal-700',
  'bg-amber-50 text-amber-700',
  'bg-rose-50 text-rose-700',
  'bg-violet-50 text-violet-700',
];

function corParaNome(nome: string) {
  const soma = nome.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PALETA[soma % PALETA.length];
}

export function Avatar({ nome, size = 36 }: { nome: string; size?: number }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${corParaNome(nome)}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {iniciais(nome)}
    </div>
  );
}
