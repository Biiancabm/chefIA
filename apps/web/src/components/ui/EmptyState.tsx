import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong bg-panel px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary-text">
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="max-w-sm">
        <p className="text-[15px] font-semibold text-text">{title}</p>
        {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
