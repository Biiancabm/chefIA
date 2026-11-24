import { Check, ChevronRight, X } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { formatarMoeda } from '../lib/format';
import type { OrdemServico } from '../types';
import { StatusBadge } from './ui/Badge';

const MS_DIA = 86_400_000;

function inicioDoDia(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

// "Hoje", "Amanhã", "Ontem" ou "qua, 18 de nov"
export function rotuloDia(iso: string) {
  const dia = inicioDoDia(new Date(iso));
  const hoje = inicioDoDia(new Date());
  const diff = Math.round((dia - hoje) / MS_DIA);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  const opcoes: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
  if (new Date(iso).getFullYear() !== new Date().getFullYear()) opcoes.year = 'numeric';
  return new Intl.DateTimeFormat('pt-BR', opcoes).format(new Date(iso)).replace(/\./g, '');
}

export function hora(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export function ehHoje(iso: string) {
  return inicioDoDia(new Date(iso)) === inicioDoDia(new Date());
}

// "Mel · Passeio de 30 minutos" (o nome do pet vem antes, quando tem)
export function resumoServicos(os: OrdemServico) {
  const servicos = os.itens.map((i) => i.servico.nome).join(', ');
  return os.assistido ? `${os.assistido.nome} · ${servicos}` : servicos;
}

function nomesExecutores(os: OrdemServico) {
  return [...new Set(os.itens.map((i) => i.vinculoExecutor.user.nome.split(' ')[0]))].join(', ');
}

// Marcador numerado da linha do tempo: concluído (check), em andamento (pulsando), cancelado (x)
export function Controle({ os, numero, tamanho = 26 }: { os: OrdemServico; numero: number; tamanho?: number }) {
  const base = 'relative z-[1] flex shrink-0 items-center justify-center rounded-full text-xs font-semibold leading-none';
  const estilo = { width: tamanho, height: tamanho };
  if (os.status === 'FINALIZADO' || os.status === 'RECEBIDO')
    return (
      <span className={`${base} bg-primary text-white`} style={estilo} title="Concluído">
        <Check size={Math.round(tamanho * 0.52)} strokeWidth={3} />
      </span>
    );
  if (os.status === 'EXECUTANDO')
    return (
      <span
        className={`${base} animate-[pulso_2s_ease-out_infinite] border-2 border-primary bg-primary-soft text-primary-text`}
        style={estilo}
        title="Em andamento"
      >
        {numero}
      </span>
    );
  if (os.status === 'CANCELADO' || os.status === 'RECUSADO')
    return (
      <span
        className={`${base} border border-dashed border-border-strong bg-surface text-text-subtle`}
        style={estilo}
        title="Cancelado"
      >
        <X size={Math.round(tamanho * 0.5)} strokeWidth={2.5} />
      </span>
    );
  return (
    <span className={`${base} border border-border-strong bg-panel text-text-muted`} style={estilo}>
      {numero}
    </span>
  );
}

// Lista de atendimentos como linha do tempo: os marcadores numerados ficam ligados por uma linha fina.
// No dia de hoje, uma marca mostra "agora" entre o que já passou e o que vem.
export function AgendaLista({
  ordens,
  onAbrir,
  mostrarCliente = true,
  mostrarExecutor = true,
  mostrarValor = true,
  acao,
  linhaAgora = true,
  cabecalhoDia = true,
}: {
  ordens: OrdemServico[];
  onAbrir: (id: string) => void;
  mostrarCliente?: boolean;
  mostrarExecutor?: boolean;
  mostrarValor?: boolean;
  acao?: (os: OrdemServico) => ReactNode;
  linhaAgora?: boolean;
  cabecalhoDia?: boolean; // esconder quando a seção já diz o dia (ex.: "Hoje")
}) {
  const grupos: { rotulo: string; hoje: boolean; ordens: OrdemServico[] }[] = [];
  for (const os of ordens) {
    const rotulo = rotuloDia(os.dataAgendada);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.rotulo === rotulo) ultimo.ordens.push(os);
    else grupos.push({ rotulo, hoje: ehHoje(os.dataAgendada), ordens: [os] });
  }

  const agora = Date.now();

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-panel shadow-card">
      {grupos.map((grupo, gi) => {
        const crescente =
          grupo.ordens.length < 2 ||
          new Date(grupo.ordens[0].dataAgendada).getTime() <=
            new Date(grupo.ordens[grupo.ordens.length - 1].dataAgendada).getTime();
        let posAgora = -1;
        if (linhaAgora && grupo.hoje && crescente) {
          posAgora = grupo.ordens.findIndex((o) => new Date(o.dataAgendada).getTime() > agora);
          if (posAgora === -1) posAgora = grupo.ordens.length;
        }
        const mostrarCabecalho = cabecalhoDia || grupos.length > 1;

        return (
          <section key={grupo.rotulo + gi} className={gi > 0 ? 'border-t border-border' : ''}>
            {mostrarCabecalho && (
              <h3 className="flex items-baseline gap-2 border-b border-border bg-surface/60 px-4 py-2 sm:px-5">
                <span
                  className={`text-[13px] font-semibold first-letter:uppercase ${grupo.hoje ? 'text-primary-text' : 'text-text'}`}
                >
                  {grupo.rotulo}
                </span>
                <span className="text-xs text-text-subtle">
                  {grupo.ordens.length} {grupo.ordens.length === 1 ? 'atendimento' : 'atendimentos'}
                </span>
              </h3>
            )}
            <ol className="relative">
              {grupo.ordens.map((os, i) => (
                <Fragment key={os.id}>
                  {i === posAgora && <LinhaAgora primeira={i === 0} />}
                  <Linha
                    os={os}
                    numero={i + 1}
                    primeira={i === 0 && posAgora !== 0}
                    ultima={i === grupo.ordens.length - 1 && posAgora !== grupo.ordens.length}
                    onAbrir={onAbrir}
                    mostrarCliente={mostrarCliente}
                    mostrarExecutor={mostrarExecutor}
                    mostrarValor={mostrarValor}
                    acao={acao?.(os)}
                  />
                </Fragment>
              ))}
              {posAgora === grupo.ordens.length && <LinhaAgora ultima />}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

// Trecho da linha do tempo, atrás do marcador
function Perna({ primeira, ultima }: { primeira?: boolean; ultima?: boolean }) {
  return (
    <span
      aria-hidden
      className="absolute left-[34px] w-px -translate-x-1/2 bg-border-strong sm:left-[38px]"
      style={{ top: primeira ? '50%' : 0, bottom: ultima ? '50%' : 0 }}
    />
  );
}

function LinhaAgora({ primeira, ultima }: { primeira?: boolean; ultima?: boolean }) {
  const agora = hora(new Date().toISOString());
  return (
    <li aria-label={`Agora, ${agora}`} className="relative flex h-7 items-center">
      <Perna primeira={primeira} ultima={ultima} />
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-primary/60" />
      <span className="num relative z-[1] ml-[10px] rounded-full bg-primary px-2 py-px text-[11px] font-medium leading-4 text-white sm:ml-[14px]">
        Agora {agora}
      </span>
    </li>
  );
}

function Linha({
  os,
  numero,
  primeira,
  ultima,
  onAbrir,
  mostrarCliente,
  mostrarExecutor,
  mostrarValor,
  acao,
}: {
  os: OrdemServico;
  numero: number;
  primeira: boolean;
  ultima: boolean;
  onAbrir: (id: string) => void;
  mostrarCliente: boolean;
  mostrarExecutor: boolean;
  mostrarValor: boolean;
  acao?: ReactNode;
}) {
  const andamento = os.status === 'EXECUTANDO';
  const apagado = os.status === 'CANCELADO' || os.status === 'RECUSADO';
  const detalhes = [mostrarCliente && os.vinculoCliente.user.nome, mostrarExecutor && nomesExecutores(os)]
    .filter(Boolean)
    .join(' · ');

  return (
    <li className={`relative border-b border-border last:border-0 ${andamento ? 'bg-primary-soft/60' : ''}`}>
      <Perna primeira={primeira} ultima={ultima} />
      <div
        role="link"
        tabIndex={0}
        onClick={() => onAbrir(os.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onAbrir(os.id);
          }
        }}
        className={`group relative grid cursor-pointer grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3 pl-[14px] pr-4 transition-colors hover:bg-surface/70 focus-visible:bg-surface/70 sm:grid-cols-[40px_48px_minmax(0,1fr)_auto_auto] sm:pl-[18px] sm:pr-5 ${
          apagado ? 'opacity-70' : ''
        }`}
      >
        <span className="flex justify-center">
          <Controle os={os} numero={numero} />
        </span>

        <span className={`hidden text-sm font-semibold sm:block ${andamento ? 'text-primary-text' : 'text-text'}`}>
          {hora(os.dataAgendada)}
        </span>

        <span className="min-w-0">
          <span className={`block truncate text-sm font-medium ${apagado ? 'text-text-muted line-through' : 'text-text'}`}>
            <span className="mr-1.5 font-semibold sm:hidden">{hora(os.dataAgendada)}</span>
            {resumoServicos(os)}
          </span>
          {detalhes && <span className="block truncate text-[13px] text-text-muted">{detalhes}</span>}
        </span>

        {mostrarValor ? (
          <span className="num hidden text-right text-[13px] font-medium text-text-muted sm:block">
            {formatarMoeda(os.valorTotal)}
          </span>
        ) : (
          <span className="hidden sm:block" />
        )}

        <span className="flex items-center justify-end gap-2 sm:w-[140px]">
          <StatusBadge status={os.status} />
          <ChevronRight
            size={16}
            className="hidden shrink-0 text-text-subtle transition-transform group-hover:translate-x-0.5 sm:block"
          />
        </span>

        {acao && (
          <div
            className="col-span-3 flex justify-end sm:col-span-5"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {acao}
          </div>
        )}
      </div>
    </li>
  );
}
