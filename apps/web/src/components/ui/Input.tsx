import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { forwardRef, useState, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  dica?: string; // texto de ajuda abaixo do campo
  icon?: LucideIcon; // ícone à esquerda dentro do campo
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, dica, id, icon: Icone, type, className = '', ...props }, ref) => {
    const inputId = id ?? props.name;
    const ehSenha = type === 'password';
    const [mostrarSenha, setMostrarSenha] = useState(false);

    return (
      <div className="flex flex-col">
        {label && (
          <label htmlFor={inputId} className="rotulo">
            {label}
          </label>
        )}
        <div className="relative">
          {Icone && (
            <Icone
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
            />
          )}
          <input
            ref={ref}
            id={inputId}
            type={ehSenha && mostrarSenha ? 'text' : type}
            aria-invalid={!!error || undefined}
            className={`campo ${Icone ? 'pl-9!' : ''} ${ehSenha ? 'pr-10!' : ''} ${
              error ? 'border-danger!' : ''
            } ${className}`}
            {...props}
          />
          {ehSenha && (
            <button
              type="button"
              onClick={() => setMostrarSenha((v) => !v)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-text-subtle transition-colors hover:bg-surface hover:text-text"
              aria-label={mostrarSenha ? 'Esconder senha' : 'Mostrar senha'}
            >
              {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error ? (
          <span className="mt-1.5 text-xs text-danger">{error}</span>
        ) : (
          dica && <span className="mt-1.5 text-xs text-text-subtle">{dica}</span>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
