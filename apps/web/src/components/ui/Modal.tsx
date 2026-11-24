import { X } from 'lucide-react';
import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  largo?: boolean;
}

// No celular vira uma folha que sobe de baixo; no computador, uma janela central
export function Modal({ open, onClose, title, description, children, largo }: ModalProps) {
  const tituloId = useId();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflowAnterior;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-[esmaecer_150ms_ease-out] bg-[#191624]/45 dark:bg-black/65"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className={`relative flex max-h-[92dvh] w-full animate-[surgir_200ms_cubic-bezier(0.16,1,0.3,1)] flex-col overflow-hidden rounded-t-2xl border border-border bg-panel shadow-overlay sm:rounded-xl ${
          largo ? 'sm:max-w-2xl' : 'sm:max-w-lg'
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id={tituloId} className="text-[17px] font-semibold leading-snug text-text">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-mr-1.5 -mt-0.5 rounded-md p-1.5 text-text-subtle transition-colors hover:bg-surface hover:text-text"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
