import type { LucideIcon } from 'lucide-react';

export function IconBadge({ icon: Icon, size = 36 }: { icon: LucideIcon; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-text"
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.48)} strokeWidth={2} />
    </div>
  );
}
