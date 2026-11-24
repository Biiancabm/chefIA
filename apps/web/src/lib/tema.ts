import { useEffect, useState } from 'react';

// Preferência de tema: claro, escuro ou seguir o sistema
export type PreferenciaTema = 'claro' | 'escuro' | 'sistema';

const CHAVE = 'universal-tema';

function lerPreferencia(): PreferenciaTema {
  try {
    const valor = localStorage.getItem(CHAVE);
    if (valor === 'claro' || valor === 'escuro') return valor;
  } catch {
    // sem acesso ao armazenamento (janela anônima etc.): segue o sistema
  }
  return 'sistema';
}

const consultaEscuro = () => window.matchMedia('(prefers-color-scheme: dark)');

function aplicar(preferencia: PreferenciaTema) {
  const escuro = preferencia === 'escuro' || (preferencia === 'sistema' && consultaEscuro().matches);
  document.documentElement.classList.toggle('dark', escuro);
}

export function useTema() {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>(lerPreferencia);

  useEffect(() => {
    aplicar(preferencia);
    try {
      if (preferencia === 'sistema') localStorage.removeItem(CHAVE);
      else localStorage.setItem(CHAVE, preferencia);
    } catch {
      // ignora: o tema continua valendo nesta sessão
    }
    if (preferencia !== 'sistema') return;
    const consulta = consultaEscuro();
    const onChange = () => aplicar('sistema');
    consulta.addEventListener('change', onChange);
    return () => consulta.removeEventListener('change', onChange);
  }, [preferencia]);

  return { preferencia, setPreferencia };
}
