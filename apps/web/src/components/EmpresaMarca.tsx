import { ImageUp } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { prepararLogo } from '../lib/imagem';
import { configSegmento } from '../lib/segmentos';
import type { Empresa } from '../types';
import { Button } from './ui/Button';

type MarcaEmpresa = Pick<Empresa, 'segmento' | 'logoUrl'>;

// A logo da empresa; sem logo, o ícone do ramo. Usada ao lado do nome em todo o site.
export function EmpresaMarca({
  empresa,
  tamanho = 32,
  forte = false,
}: {
  empresa: MarcaEmpresa;
  tamanho?: number;
  forte?: boolean; // ícone em violeta cheio (a empresa atual) em vez do violeta suave
}) {
  const [falhou, setFalhou] = useState<string | null>(null);
  const raio = Math.max(6, Math.round(tamanho * 0.24));

  if (empresa.logoUrl && falhou !== empresa.logoUrl) {
    // Fundo branco nos dois temas: logos costumam ser desenhadas para fundo claro
    return (
      <span
        className="flex shrink-0 items-center justify-center overflow-hidden border border-border bg-white"
        style={{ width: tamanho, height: tamanho, borderRadius: raio, padding: Math.round(tamanho * 0.08) }}
      >
        <img
          src={empresa.logoUrl}
          alt=""
          className="h-full w-full object-contain"
          onError={() => setFalhou(empresa.logoUrl)}
        />
      </span>
    );
  }

  const Icone = configSegmento(empresa.segmento).icon;
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${
        forte ? 'bg-primary text-white' : 'bg-primary-soft text-primary-text'
      }`}
      style={{ width: tamanho, height: tamanho, borderRadius: raio }}
    >
      <Icone size={Math.round(tamanho * 0.5)} strokeWidth={2} />
    </span>
  );
}

// Campo de envio da logo: prévia, trocar e remover
export function LogoCampo({
  valor,
  onChange,
  segmento,
}: {
  valor: string | null;
  onChange: (logo: string | null) => void;
  segmento: Empresa['segmento'];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(false);

  async function escolher(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    setErro('');
    setProcessando(true);
    try {
      onChange(await prepararLogo(arquivo));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível usar essa imagem.');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div>
      <p className="rotulo">Logo</p>
      <div className="flex items-center gap-4">
        <EmpresaMarca empresa={{ segmento, logoUrl: valor }} tamanho={64} />
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              tamanho="sm"
              loading={processando}
              onClick={() => inputRef.current?.click()}
            >
              {!processando && <ImageUp size={14} />}
              {valor ? 'Trocar logo' : 'Enviar logo'}
            </Button>
            {valor && (
              <Button type="button" variant="ghost" tamanho="sm" onClick={() => onChange(null)}>
                Remover
              </Button>
            )}
          </div>
          <span className="text-xs text-text-subtle">PNG, JPG, SVG ou WebP. Aparece ao lado do nome da empresa.</span>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={escolher}
      />
      {erro && (
        <p role="alert" className="mt-2 text-[13px] text-danger">
          {erro}
        </p>
      )}
    </div>
  );
}
