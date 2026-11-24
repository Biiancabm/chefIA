import { useEffect, useState } from 'react';

// Evento que o Chrome/Edge (Android e computador) dispara quando o app pode ser instalado
interface EventoInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let eventoGuardado: EventoInstalacao | null = null;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // o app mostra o próprio botão "Instalar"
    eventoGuardado = e as EventoInstalacao;
    avisar();
  });
  window.addEventListener('appinstalled', () => {
    eventoGuardado = null;
    avisar();
  });
}

// Registra o service worker. Só no site final (npm run build): no modo de desenvolvimento
// ele guardaria arquivos antigos e atrapalharia o recarregamento automático.
export function registrarServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Sem service worker o site funciona normalmente, só não fica instalável
    });
  });
}

// Já está aberto como app instalado (tela cheia, sem barra do navegador)?
export function abertoComoApp() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// iPhone/iPad: não tem botão de instalar; é pelo Safari, em Compartilhar > Adicionar à Tela de Início
export function ehIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Como o app pode ser instalado neste aparelho agora:
// "prompt" = botão nativo disponível, "ios" = mostrar o passo a passo, null = já instalado ou não dá
export function useInstalacao() {
  const [, forcar] = useState(0);
  useEffect(() => {
    const f = () => forcar((n) => n + 1);
    ouvintes.add(f);
    return () => {
      ouvintes.delete(f);
    };
  }, []);

  const modo: 'prompt' | 'ios' | null = abertoComoApp()
    ? null
    : eventoGuardado
      ? 'prompt'
      : ehIOS()
        ? 'ios'
        : null;

  async function instalar() {
    if (!eventoGuardado) return;
    await eventoGuardado.prompt();
    await eventoGuardado.userChoice;
    eventoGuardado = null;
    avisar();
  }

  return { modo, instalar };
}
