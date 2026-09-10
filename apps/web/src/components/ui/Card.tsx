import type { HTMLAttributes } from 'react';

export function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-border bg-background p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
