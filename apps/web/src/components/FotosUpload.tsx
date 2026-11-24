import { isAxiosError } from 'axios';
import { Camera, ImagePlus, Loader2, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { enviarFoto } from '../lib/imagem';

function mensagemDeErro(erro: unknown) {
  if (isAxiosError(erro)) {
    const msg = erro.response?.data?.message;
    if (typeof msg === 'string') return msg;
    return 'Não foi possível enviar a foto. Tente de novo.';
  }
  return erro instanceof Error ? erro.message : 'Não foi possível enviar a foto.';
}

// Escolher (ou tirar, no celular) fotos e enviá-las na hora. Devolve os endereços das fotos.
export function FotosUpload({
  valor,
  onChange,
  maximo = 10,
  rotulo = 'Fotos',
}: {
  valor: string[];
  onChange: (fotos: string[]) => void;
  maximo?: number;
  rotulo?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(0);
  const [erro, setErro] = useState('');

  async function escolher(e: ChangeEvent<HTMLInputElement>) {
    const arquivos = [...(e.target.files ?? [])].slice(0, maximo - valor.length);
    e.target.value = '';
    if (!arquivos.length) return;
    setErro('');
    setEnviando(arquivos.length);
    const novas: string[] = [];
    for (const arquivo of arquivos) {
      try {
        novas.push(await enviarFoto(arquivo));
      } catch (err) {
        setErro(mensagemDeErro(err));
      }
      setEnviando((n) => n - 1);
    }
    if (novas.length) onChange([...valor, ...novas]);
  }

  const cabeMais = valor.length + enviando < maximo;

  return (
    <div>
      <p className="rotulo">
        {rotulo} <span className="font-normal text-text-subtle">(opcional)</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {valor.map((url) => (
          <div key={url} className="relative">
            <img src={url} alt="" className="h-20 w-20 rounded-lg border border-border object-cover" />
            <button
              type="button"
              onClick={() => onChange(valor.filter((f) => f !== url))}
              aria-label="Tirar essa foto"
              className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-panel text-text-muted shadow-card hover:text-danger"
            >
              <X size={13} />
            </button>
          </div>
        ))}
        {Array.from({ length: enviando }, (_, i) => (
          <div
            key={`enviando-${i}`}
            className="flex h-20 w-20 items-center justify-center rounded-lg border border-border bg-surface text-text-subtle"
          >
            <Loader2 size={18} className="animate-spin" />
          </div>
        ))}
        {cabeMais && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-strong text-xs font-medium text-text-muted transition-colors hover:border-primary hover:text-primary-text"
          >
            <ImagePlus size={18} />
            Adicionar
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={escolher} />
      {erro && (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {erro}
        </p>
      )}
    </div>
  );
}

// Uma foto só (ex.: a foto do pet), com prévia redonda
export function FotoUnicaUpload({
  valor,
  onChange,
  previa,
}: {
  valor: string;
  onChange: (url: string) => void;
  previa: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  async function escolher(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    setErro('');
    setEnviando(true);
    try {
      onChange(await enviarFoto(arquivo));
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {previa}
        {enviando && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-panel/70">
            <Loader2 size={18} className="animate-spin text-text-muted" />
          </span>
        )}
      </div>
      <div className="flex flex-col items-start gap-1">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={enviando}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-strong bg-panel px-3 text-[13px] font-medium text-text transition-colors hover:bg-surface disabled:opacity-60"
          >
            <Camera size={14} />
            {valor ? 'Trocar foto' : 'Escolher foto'}
          </button>
          {valor && !enviando && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="inline-flex h-8 items-center rounded-lg px-2.5 text-[13px] font-medium text-text-muted transition-colors hover:bg-surface hover:text-danger"
            >
              Tirar
            </button>
          )}
        </div>
        <p className="text-xs text-text-subtle">Da galeria ou da câmera do celular.</p>
        {erro && (
          <p role="alert" className="text-xs text-danger">
            {erro}
          </p>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={escolher} />
    </div>
  );
}
