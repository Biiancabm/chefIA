import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Tamanho = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  tamanho?: Tamanho;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover disabled:opacity-50',
  secondary: 'border border-border-strong bg-panel text-text hover:bg-surface disabled:opacity-50',
  ghost: 'text-text-muted hover:bg-surface hover:text-text disabled:opacity-50',
  danger: 'border border-danger/40 bg-panel text-danger hover:border-danger hover:bg-danger-soft disabled:opacity-50',
};

const TAMANHO_CLASSES: Record<Tamanho, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-11 px-5 text-[15px] gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', tamanho = 'md', loading, className = '', disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={`inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors duration-150 disabled:cursor-not-allowed ${TAMANHO_CLASSES[tamanho]} ${VARIANT_CLASSES[variant]} ${className}`}
        {...props}
      >
        {loading && (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

// Botão só com ícone (editar, remover, copiar...). Sempre com rótulo acessível.
export function IconButton({
  label,
  perigo = false,
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; perigo?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-subtle transition-colors ${
        perigo ? 'hover:bg-danger-soft hover:text-danger' : 'hover:bg-surface hover:text-text'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
