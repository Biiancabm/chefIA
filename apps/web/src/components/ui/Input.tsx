import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`rounded-lg border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-subtle outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-light ${
            error ? 'border-status-cancelado-text' : 'border-border'
          } ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs text-status-cancelado-text">{error}</span>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
