import type { LucideIcon } from 'lucide-react';
import { IconBadge } from './IconBadge';
import { Card } from './Card';

export function StatCard({
  icon,
  cor,
  valor,
  label,
}: {
  icon: LucideIcon;
  cor: 'blue' | 'green' | 'amber' | 'violet' | 'rose';
  valor: number | string;
  label: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <IconBadge icon={icon} cor={cor} size={44} />
      <div>
        <p className="text-2xl font-semibold leading-none text-text">{valor}</p>
        <p className="mt-1.5 text-sm text-text-muted">{label}</p>
      </div>
    </Card>
  );
}
