// Símbolo do easyService: o visto saindo do círculo, com ícones de pets em volta, num quadrado lilás
// (public/logo-icone.svg; o mesmo desenho dos ícones do app)
export function LogoMarca({ tamanho = 28 }: { tamanho?: number }) {
  return (
    <img
      src="/logo-icone.svg"
      width={tamanho}
      height={tamanho}
      alt=""
      aria-hidden="true"
      className="shrink-0"
      draggable={false}
    />
  );
}

// Logo completo: símbolo + nome ("easy" leve, "Service" forte)
export function Logo({ tamanho = 28, claro = false }: { tamanho?: number; claro?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMarca tamanho={tamanho} />
      <span
        className={`leading-none tracking-[-0.01em] ${claro ? 'text-white' : 'text-text'}`}
        style={{ fontSize: Math.round(tamanho * 0.62) }}
      >
        <span className="font-normal">easy</span>
        <span className="font-bold">Service</span>
      </span>
    </span>
  );
}
