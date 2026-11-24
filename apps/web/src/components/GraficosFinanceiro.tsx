import { useState } from 'react';
import { formatarMoeda } from '../lib/format';
import { SectionTitle } from './ui/Card';

// Gráficos do Financeiro, iguais para o administrador e para o passeador

export interface Fatia {
  chave: string;
  nome: string;
  valor: number;
  qtd: number;
}

function nomeMes(mes: Date) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(mes);
}

// Quanto cada serviço (ou profissional) soma no mês
export function Ranking({ titulo, fatias, total }: { titulo: string; fatias: Fatia[]; total: number }) {
  if (!fatias.length) return null;
  const maior = fatias[0].valor || 1;
  return (
    <section>
      <SectionTitle>{titulo}</SectionTitle>
      <ul className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-4 shadow-card">
        {fatias.slice(0, 6).map((f) => (
          <li key={f.chave} title={`${f.nome}: ${formatarMoeda(f.valor)}`}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm text-text">{f.nome}</span>
              <span className="num shrink-0 text-sm font-semibold text-text">{formatarMoeda(f.valor)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(f.valor / maior) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs text-text-subtle">
              {f.qtd} {f.qtd === 1 ? 'vez' : 'vezes'}
              {total > 0 && ` · ${Math.round((f.valor / total) * 100)}% do mês`}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function mesCurto(m: Date) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(m).replace('.', '');
}

// Barras verticais, uma por mês, numa cor só (é uma série só: sem legenda, o título diz o que é).
// O mês escolhido fica em destaque e com o valor escrito; nos outros o valor aparece ao passar
// o mouse ou focar. Clicar numa barra abre aquele mês. Uma tabela escondida serve aos leitores de tela.
export function GraficoMeses({
  dados,
  selecionado,
  onEscolher,
  titulo,
  formatar,
}: {
  dados: { mes: Date; valor: number }[];
  selecionado: Date;
  onEscolher: (mes: Date) => void;
  titulo: string;
  formatar: (valor: number) => string;
}) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const maximo = Math.max(...dados.map((d) => d.valor), 0);
  const vazio = maximo === 0;
  const ALTURA = 144;

  return (
    <section className="rounded-xl border border-border bg-panel p-5 shadow-card sm:p-6">
      <h2 className="text-sm font-semibold text-text">{titulo}</h2>
      <p className="mt-0.5 text-[13px] text-text-subtle">Últimos 6 meses · toque numa barra para ver o mês</p>

      {vazio ? (
        <p className="mt-5 rounded-lg bg-surface px-4 py-6 text-center text-[13px] text-text-muted">
          Ainda não há nada concluído nesses meses.
        </p>
      ) : (
        <div className="mt-6" aria-hidden>
          <div className="relative flex items-end gap-2 border-b border-border-strong sm:gap-4" style={{ height: ALTURA }}>
            {dados.map((d, i) => {
              const escolhido = d.mes.getTime() === selecionado.getTime();
              const altura = d.valor > 0 ? Math.max(4, Math.round((d.valor / maximo) * (ALTURA - 28))) : 0;
              const mostrarValor = escolhido || ativo === i;
              return (
                <button
                  key={d.mes.getTime()}
                  type="button"
                  tabIndex={-1}
                  onClick={() => onEscolher(d.mes)}
                  onMouseEnter={() => setAtivo(i)}
                  onMouseLeave={() => setAtivo(null)}
                  className="group relative flex h-full flex-1 cursor-pointer flex-col items-center justify-end"
                >
                  {mostrarValor && (
                    <span
                      className={`num absolute whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                        escolhido && ativo !== i ? 'text-text' : 'bg-text text-panel shadow-overlay'
                      }`}
                      style={{ bottom: altura + 6 }}
                    >
                      {formatar(d.valor)}
                    </span>
                  )}
                  <span
                    className={`w-full max-w-9 rounded-t-[4px] transition-colors ${
                      escolhido ? 'bg-primary' : 'bg-primary/35 group-hover:bg-primary/55'
                    }`}
                    style={{ height: altura }}
                  />
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex gap-2 sm:gap-4">
            {dados.map((d) => {
              const escolhido = d.mes.getTime() === selecionado.getTime();
              return (
                <span
                  key={d.mes.getTime()}
                  className={`flex-1 text-center text-xs ${escolhido ? 'font-semibold text-text' : 'text-text-subtle'}`}
                >
                  {mesCurto(d.mes)}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead>
          <tr>
            <th scope="col">Mês</th>
            <th scope="col">Valor</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((d) => (
            <tr key={d.mes.getTime()}>
              <th scope="row">{nomeMes(d.mes)}</th>
              <td>{formatar(d.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// Os 6 meses até o mês escolhido (o mais antigo primeiro), com o valor de cada um
export function ultimosMeses(mes: Date, valorDoMes: (m: Date) => number, quantidade = 6) {
  return Array.from({ length: quantidade }, (_, i) => {
    const m = new Date(mes.getFullYear(), mes.getMonth() + i - (quantidade - 1), 1);
    return { mes: m, valor: valorDoMes(m) };
  });
}
