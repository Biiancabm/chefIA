import { Download, Plus, Share, Smartphone, X } from 'lucide-react';
import { useState } from 'react';
import { useInstalacao } from '../lib/pwa';
import { LogoMarca } from './Logo';
import { Button, IconButton } from './ui/Button';
import { Modal } from './ui/Modal';

const CHAVE_DISPENSADO = 'easyservice:instalar-dispensado';

function lerDispensado() {
  try {
    return localStorage.getItem(CHAVE_DISPENSADO) === '1';
  } catch {
    return false;
  }
}

// Passo a passo do iPhone: no Safari não existe botão de instalar
function ComoInstalarNoIphone({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Instalar no iPhone" description="Leva 10 segundos, pelo Safari.">
      <ol className="flex flex-col gap-4 text-sm text-text">
        <li className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[13px] font-semibold text-primary-text">
            1
          </span>
          <span className="pt-1">
            Toque em <Share size={15} className="mx-0.5 inline align-[-2px]" aria-label="Compartilhar" />{' '}
            <strong className="font-medium">Compartilhar</strong>, na barra do Safari.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[13px] font-semibold text-primary-text">
            2
          </span>
          <span className="pt-1">
            Escolha <Plus size={15} className="mx-0.5 inline align-[-2px]" aria-hidden />{' '}
            <strong className="font-medium">Adicionar à Tela de Início</strong>.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[13px] font-semibold text-primary-text">
            3
          </span>
          <span className="pt-1">
            Toque em <strong className="font-medium">Adicionar</strong>. O easyService aparece na tela inicial e abre em
            tela cheia, como um app.
          </span>
        </li>
      </ol>
      <div className="mt-5 flex justify-end border-t border-border pt-4">
        <Button onClick={onClose}>Entendi</Button>
      </div>
    </Modal>
  );
}

// Item "Instalar app" do menu da conta. Some quando já está instalado ou o aparelho não permite.
export function ItemInstalarApp() {
  const { modo, instalar } = useInstalacao();
  const [passoIos, setPassoIos] = useState(false);
  if (!modo) return null;

  return (
    <>
      <button
        type="button"
        role="menuitem"
        onClick={() => (modo === 'prompt' ? instalar() : setPassoIos(true))}
        className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-text-muted transition-colors hover:bg-surface hover:text-text"
      >
        <Smartphone size={15} />
        Instalar o app no celular
      </button>
      <ComoInstalarNoIphone open={passoIos} onClose={() => setPassoIos(false)} />
    </>
  );
}

// Aviso na tela inicial (só no celular, até a pessoa instalar ou dispensar)
export function AvisoInstalarApp() {
  const { modo, instalar } = useInstalacao();
  const [dispensado, setDispensado] = useState(lerDispensado);
  const [passoIos, setPassoIos] = useState(false);
  if (!modo || dispensado) return null;

  function dispensar() {
    setDispensado(true);
    try {
      localStorage.setItem(CHAVE_DISPENSADO, '1');
    } catch {
      // sem armazenamento, o aviso volta na próxima visita
    }
  }

  return (
    <section className="flex items-center gap-3 rounded-xl border border-primary-line bg-panel p-3.5 shadow-card md:hidden">
      <LogoMarca tamanho={40} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text">Use o easyService como app</p>
        <p className="text-[13px] leading-snug text-text-muted">Ícone na tela inicial e tela cheia, sem navegador.</p>
      </div>
      <Button tamanho="sm" onClick={() => (modo === 'prompt' ? instalar() : setPassoIos(true))}>
        <Download size={14} />
        Instalar
      </Button>
      <IconButton label="Agora não" onClick={dispensar}>
        <X size={15} />
      </IconButton>
      <ComoInstalarNoIphone open={passoIos} onClose={() => setPassoIos(false)} />
    </section>
  );
}
