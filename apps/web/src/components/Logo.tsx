// Símbolo: um "visto" branco (serviço feito, sem complicação) num quadrado violeta de cantos arredondados
export function LogoMarca({ tamanho = 28 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <rect width="32" height="32" rx="9" fill="var(--primary)" />
      <path
        d="M10 16.5l4.2 4.2L22.5 12"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Logo completo: símbolo + nome
export function Logo({ tamanho = 28, claro = false }: { tamanho?: number; claro?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMarca tamanho={tamanho} />
      <span
        className={`font-semibold leading-none tracking-[-0.01em] ${claro ? 'text-white' : 'text-text'}`}
        style={{ fontSize: Math.round(tamanho * 0.6) }}
      >
        easyService
      </span>
    </span>
  );
}
