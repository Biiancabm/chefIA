import type { LucideIcon } from 'lucide-react';

type Cor = 'blue' | 'green' | 'amber' | 'violet' | 'rose';

const COR_CLASSES: Record<Cor, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  violet: 'bg-violet-50 text-violet-600',
  rose: 'bg-rose-50 text-rose-600',
};

export function IconBadge({
  icon: Icon,
  cor = 'blue',
  size = 40,
}: {
  icon: LucideIcon;
  cor?: Cor;
  size?: number;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl ${COR_CLASSES[cor]}`}
      style={{ width: size, height: size }}
    >
      <Icon size={size * 0.5} strokeWidth={1.75} />
    </div>
  );
}
