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
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-text-subtle">
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-sm font-medium text-text">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
