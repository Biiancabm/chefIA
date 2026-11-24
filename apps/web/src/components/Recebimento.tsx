import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Check } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { FormaPagamento, OrdemServico } from '../types';
import { Button } from './ui/Button';

// Situação financeira de um atendimento. As três primeiras dividem o mês sem sobra:
// o que já entrou, o que foi feito e falta receber, e o que ainda vai acontecer.
export type Situacao = 'recebido' | 'receber' | 'previsto' | 'cancelado';

export function situacao(os: OrdemServico): Situacao {
  // Cancelado, recusado ou pedido ainda não aceito: fica fora das contas
  if (['CANCELADO', 'RECUSADO', 'PENDENTE_CLIENTE', 'PENDENTE_EXECUTOR'].includes(os.status)) return 'cancelado';
  if (os.pagoEm) return 'recebido';
  if (os.status === 'FINALIZADO' || os.status === 'RECEBIDO') return 'receber';
  return 'previsto';
}

export const SITUACOES: Record<Exclude<Situacao, 'cancelado'>, { rotulo: string; cor: string; badge: string }> = {
  recebido: { rotulo: 'Recebido', cor: 'bg-fin-recebido', badge: 'bg-ok-soft text-ok' },
  receber: { rotulo: 'A receber', cor: 'bg-fin-receber', badge: 'bg-primary-soft text-primary-text' },
  previsto: { rotulo: 'Previsto', cor: 'bg-fin-previsto', badge: 'bg-surface text-text-muted' },
};

export const FORMAS: { valor: FormaPagamento; curto: string; longo: string }[] = [
  { valor: 'PIX', curto: 'Pix', longo: 'Pix' },
  { valor: 'DINHEIRO', curto: 'Dinheiro', longo: 'Dinheiro' },
  { valor: 'CARTAO_CREDITO', curto: 'Crédito', longo: 'Cartão de crédito' },
  { valor: 'CARTAO_DEBITO', curto: 'Débito', longo: 'Cartão de débito' },
  { valor: 'TRANSFERENCIA', curto: 'Transferência', longo: 'Transferência' },
  { valor: 'OUTRO', curto: 'Outro', longo: 'Outra forma' },
];

export function nomeForma(forma: FormaPagamento | null) {
  return FORMAS.find((f) => f.valor === forma)?.longo ?? null;
}

// "Recebido em 12 nov · Pix"
export function descricaoRecebimento(os: OrdemServico) {
  if (!os.pagoEm) return null;
  const data = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })
    .format(new Date(os.pagoEm))
    .replace(/\./g, '');
  const forma = nomeForma(os.formaPagamento);
  return forma ? `${data} · ${forma}` : data;
}

export function SituacaoBadge({ valor }: { valor: Exclude<Situacao, 'cancelado'> }) {
  const s = SITUACOES[valor];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium leading-5 ${s.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.cor}`} aria-hidden />
      {s.rotulo}
    </span>
  );
}

function hojeLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function mensagemDeErro(erro: unknown) {
  const msg = isAxiosError(erro) ? erro.response?.data?.message : null;
  if (Array.isArray(msg)) return msg[0];
  if (typeof msg === 'string') return msg;
  return 'Não foi possível registrar. Tente de novo.';
}

function useAtualizarOrdem(empresaId: string, ordemId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['ordens-servico', empresaId] });
    queryClient.invalidateQueries({ queryKey: ['ordem-servico', ordemId] });
  };
}

// Registro do recebimento no próprio lugar (linha da lista ou detalhe), sem janela:
// escolhe a forma, confere a data e confirma.
export function FormRecebimento({
  os,
  empresaId,
  onFechar,
}: {
  os: OrdemServico;
  empresaId: string;
  onFechar: () => void;
}) {
  const atualizar = useAtualizarOrdem(empresaId, os.id);
  const hoje = hojeLocal();
  const [forma, setForma] = useState<FormaPagamento>('PIX');
  const [data, setData] = useState(hoje);

  const registrar = useMutation({
    mutationFn: async () =>
      api.patch(`/empresas/${empresaId}/ordens-servico/${os.id}/pagamento`, {
        pago: true,
        formaPagamento: forma,
        // Hoje: vale o horário do registro. Outro dia: meio-dia, para o fuso não trocar a data
        pagoEm: data === hoje ? undefined : new Date(`${data}T12:00:00`).toISOString(),
      }),
    onSuccess: () => {
      atualizar();
      onFechar();
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    registrar.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <fieldset>
        <legend className="rotulo">Forma de pagamento</legend>
        <div className="flex flex-wrap gap-1.5">
          {FORMAS.map((f) => {
            const ativa = forma === f.valor;
            return (
              <label
                key={f.valor}
                className={`flex h-8 cursor-pointer select-none items-center rounded-lg border px-3 text-[13px] font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40 ${
                  ativa
                    ? 'border-primary bg-primary-soft text-primary-text'
                    : 'border-border-strong bg-panel text-text-muted hover:bg-surface hover:text-text'
                }`}
              >
                <input
                  type="radio"
                  name={`forma-${os.id}`}
                  value={f.valor}
                  checked={ativa}
                  onChange={() => setForma(f.valor)}
                  className="sr-only"
                />
                {f.curto}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="flex flex-col">
          <span className="rotulo">Data do recebimento</span>
          <input
            type="date"
            className="campo w-44"
            value={data}
            max={hoje}
            required
            onChange={(e) => setData(e.target.value)}
          />
        </label>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="submit" loading={registrar.isPending}>
            {!registrar.isPending && <Check size={15} strokeWidth={2.5} />}
            Confirmar recebimento
          </Button>
        </div>
      </div>

      {registrar.isError && (
        <p role="alert" className="text-[13px] text-danger">
          {mensagemDeErro(registrar.error)}
        </p>
      )}
    </form>
  );
}

// Volta o atendimento para "a receber" (ex.: marcado por engano)
export function useDesfazerRecebimento(empresaId: string, os: OrdemServico) {
  const atualizar = useAtualizarOrdem(empresaId, os.id);
  return useMutation({
    mutationFn: async () => api.patch(`/empresas/${empresaId}/ordens-servico/${os.id}/pagamento`, { pago: false }),
    onSuccess: atualizar,
  });
}
