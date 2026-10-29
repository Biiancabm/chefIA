import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Link2, Plus, Users, X } from 'lucide-react';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { formatarData } from '../../lib/format';
import { texto } from '../../lib/segmentos';
import type { Convite, Membro, PapelVinculo } from '../../types';
import type { EmpresaOutletContext } from './EmpresaLayout';

type Termos = EmpresaOutletContext['termos'];

export function EquipePage() {
  const { empresaId, termos } = useOutletContext<EmpresaOutletContext>();
  const GRUPOS: { papel: PapelVinculo; titulo: string }[] = [
    { papel: 'EXECUTOR', titulo: termos.executor.plural },
    { papel: 'CLIENTE', titulo: termos.cliente.plural },
  ];
  const queryClient = useQueryClient();
  const [conviteModalAberto, setConviteModalAberto] = useState(false);

  const { data: membros, isLoading: carregandoMembros } = useQuery({
    queryKey: ['membros', empresaId],
    queryFn: async () => (await api.get<Membro[]>(`/empresas/${empresaId}/membros`)).data,
  });

  const { data: convites, isLoading: carregandoConvites } = useQuery({
    queryKey: ['convites', empresaId],
    queryFn: async () => (await api.get<Convite[]>(`/empresas/${empresaId}/convites`)).data,
  });

  const removerMembro = useMutation({
    mutationFn: async (vinculoId: string) =>
      api.delete(`/empresas/${empresaId}/membros/${vinculoId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['membros', empresaId] }),
  });

  const revogarConvite = useMutation({
    mutationFn: async (conviteId: string) =>
      api.delete(`/empresas/${empresaId}/convites/${conviteId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['convites', empresaId] }),
  });

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Equipe</h1>
          <p className="text-sm text-text-muted">
            {termos.executor.plural} e {texto.min(termos.cliente, true)} vinculados a essa empresa
          </p>
        </div>
        <Button onClick={() => setConviteModalAberto(true)}>
          <Plus size={16} />
          Convidar
        </Button>
      </div>

      {!carregandoMembros && (
        <div className="flex flex-col gap-6">
          {GRUPOS.map((grupo) => {
            const lista = membros?.filter((m) => m.papel === grupo.papel) ?? [];
            return (
              <div key={grupo.papel}>
                <h2 className="mb-3 text-sm font-medium text-text-muted">
                  {grupo.titulo} ({lista.length})
                </h2>
                {!lista.length ? (
                  <p className="text-sm text-text-subtle">Ninguém por aqui ainda.</p>
                ) : (
                  <Card className="divide-y divide-border p-0">
                    {lista.map((membro) => (
                      <div
                        key={membro.id}
                        className="flex items-center justify-between gap-3 px-6 py-3.5"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar nome={membro.user.nome} />
                          <div>
                            <p className="text-sm font-medium text-text">
                              {membro.user.nome}
                            </p>
                            <p className="text-xs text-text-muted">{membro.user.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removerMembro.mutate(membro.id)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-subtle transition-colors hover:bg-status-cancelado-bg hover:text-status-cancelado-text"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-medium text-text-muted">Convites ativos</h2>
        {!carregandoConvites && !convites?.length && (
          <EmptyState
            icon={Link2}
            title="Nenhum convite ativo"
            description={`Gere um link para um ${texto.min(termos.executor)} ou ${texto.min(termos.cliente)} entrar na empresa.`}
          />
        )}
        {!!convites?.length && (
          <Card className="divide-y divide-border p-0">
            {convites.map((convite) => (
              <ConviteRow
                key={convite.id}
                convite={convite}
                termos={termos}
                onRevogar={() => revogarConvite.mutate(convite.id)}
              />
            ))}
          </Card>
        )}
      </div>

      <ConviteModal
        open={conviteModalAberto}
        empresaId={empresaId}
        termos={termos}
        onClose={() => setConviteModalAberto(false)}
      />
    </div>
  );
}

function ConviteRow({
  convite,
  termos,
  onRevogar,
}: {
  convite: Convite;
  termos: Termos;
  onRevogar: () => void;
}) {
  const link = `${window.location.origin}/convites/${convite.token}`;
  return (
    <div className="flex items-center justify-between gap-3 px-6 py-3.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text">
            {convite.papel === 'EXECUTOR' ? termos.executor.singular : termos.cliente.singular}
          </span>
          <span className="text-xs text-text-subtle">
            expira em {formatarData(convite.expiraEm)}
          </span>
        </div>
        <p className="truncate text-xs text-text-muted">
          {convite.emailConvidado ?? link}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <CopyButton texto={link} />
        <button
          onClick={onRevogar}
          className="rounded-lg p-2 text-text-subtle transition-colors hover:bg-status-cancelado-bg hover:text-status-cancelado-text"
          title="Revogar convite"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function CopyButton({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  return (
    <button
      onClick={copiar}
      className="rounded-lg p-2 text-text-subtle transition-colors hover:bg-surface hover:text-text"
      title="Copiar link"
    >
      {copiado ? <Check size={16} className="text-status-recebido-text" /> : <Copy size={16} />}
    </button>
  );
}

function ConviteModal({
  open,
  empresaId,
  termos,
  onClose,
}: {
  open: boolean;
  empresaId: string;
  termos: Termos;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [papel, setPapel] = useState<'EXECUTOR' | 'CLIENTE'>('EXECUTOR');
  const [email, setEmail] = useState('');
  const [resultado, setResultado] = useState<{ link: string; email: string | null } | null>(
    null,
  );

  const mutation = useMutation({
    mutationFn: async () =>
      (
        await api.post<Convite>(`/empresas/${empresaId}/convites`, {
          papel,
          emailConvidado: email.trim() || undefined,
        })
      ).data,
    onSuccess: (convite) => {
      queryClient.invalidateQueries({ queryKey: ['convites', empresaId] });
      setResultado({
        link: `${window.location.origin}/convites/${convite.token}`,
        email: convite.emailConvidado,
      });
    },
  });

  function fechar() {
    setResultado(null);
    setEmail('');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={fechar}
      title="Convidar para a empresa"
      description="Compartilhe o link com quem você quer convidar"
    >
      {resultado ? (
        <div className="flex flex-col gap-4">
          {resultado.email && (
            <p className="text-sm text-text-muted">
              Convite enviado para <strong className="text-text">{resultado.email}</strong>.
              Você também pode compartilhar o link diretamente:
            </p>
          )}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5">
            <p className="min-w-0 flex-1 truncate text-sm text-text">{resultado.link}</p>
            <CopyButton texto={resultado.link} />
          </div>
          <Button onClick={fechar}>Concluir</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-text">Tipo de convite</p>
            <div className="flex gap-2">
              {(['EXECUTOR', 'CLIENTE'] as const).map((opcao) => (
                <button
                  key={opcao}
                  onClick={() => setPapel(opcao)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    papel === opcao
                      ? 'border-primary bg-primary-light text-primary-hover'
                      : 'border-border text-text-muted hover:bg-surface'
                  }`}
                >
                  <Users size={15} />
                  {opcao === 'EXECUTOR' ? termos.executor.singular : termos.cliente.singular}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text">
              Email (opcional)
            </label>
            <Input
              type="email"
              placeholder="pessoa@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-text-subtle">
              Se informado, enviamos o convite por email e só essa conta poderá aceitá-lo.
            </p>
          </div>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>
            {email.trim() ? 'Enviar convite' : 'Gerar link'}
          </Button>
        </div>
      )}
    </Modal>
  );
}
