import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, ClipboardList, Pencil, Plus, Trash2, Users as UsersIcon } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconBadge } from '../../components/ui/IconBadge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { formatarMoeda } from '../../lib/format';
import type { Membro, Servico, TipoCampoRelatorio } from '../../types';
import type { EmpresaOutletContext } from './EmpresaLayout';
import { texto } from '../../lib/segmentos';

const TIPO_CAMPO_LABEL: Record<TipoCampoRelatorio, string> = {
  CHECKBOX: 'Confirmação (sim/não)',
  TEXTO_CURTO: 'Texto curto',
  TEXTO_LONGO: 'Texto longo',
};

export function ServicosPage() {
  const { empresaId, papel, termos } = useOutletContext<EmpresaOutletContext>();
  const isAdmin = papel === 'ADMIN';
  const queryClient = useQueryClient();

  const [formAberto, setFormAberto] = useState(false);
  const [servicoEditandoId, setServicoEditandoId] = useState<string | null>(null);
  const [servicoExecutoresId, setServicoExecutoresId] = useState<string | null>(null);
  const [servicoChecklistId, setServicoChecklistId] = useState<string | null>(null);

  const { data: servicos, isLoading } = useQuery({
    queryKey: ['servicos', empresaId],
    queryFn: async () =>
      (
        await api.get<Servico[]>(`/empresas/${empresaId}/servicos`, {
          params: isAdmin ? { incluirInativos: 'true' } : undefined,
        })
      ).data,
  });

  const toggleAtivo = useMutation({
    mutationFn: async (servico: Servico) =>
      api.patch(`/empresas/${empresaId}/servicos/${servico.id}`, {
        ativo: !servico.ativo,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['servicos', empresaId] }),
  });

  if (isLoading) {
    return <p className="text-text-muted">Carregando serviços...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Serviços</h1>
          <p className="text-sm text-text-muted">
            Catálogo de serviços prestados por essa empresa
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setFormAberto(true)}>
            <Plus size={16} />
            Novo serviço
          </Button>
        )}
      </div>

      {!servicos?.length && (
        <EmptyState
          icon={Briefcase}
          title="Nenhum serviço cadastrado"
          description={
            isAdmin
              ? 'Cadastre o primeiro serviço do catálogo da empresa.'
              : 'Ainda não há serviços cadastrados nessa empresa.'
          }
          action={
            isAdmin ? (
              <Button variant="secondary" onClick={() => setFormAberto(true)}>
                Novo serviço
              </Button>
            ) : undefined
          }
        />
      )}

      {!!servicos?.length && (
        <Card className="divide-y divide-border p-0">
          {servicos.map((servico) => (
            <div
              key={servico.id}
              className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <IconBadge icon={Briefcase} cor={servico.ativo ? 'blue' : 'rose'} size={38} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-text">{servico.nome}</p>
                    {!servico.ativo && (
                      <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-text-subtle">
                        Inativo
                      </span>
                    )}
                  </div>
                  {servico.descricao && (
                    <p className="mt-0.5 truncate text-sm text-text-muted">
                      {servico.descricao}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {servico.executores.slice(0, 3).map((ex) => (
                  <div key={ex.vinculoExecutorId} title={ex.nome}>
                    <Avatar nome={ex.nome} size={28} />
                  </div>
                ))}
                {servico.executores.length > 3 && (
                  <span className="text-xs text-text-muted">
                    +{servico.executores.length - 3}
                  </span>
                )}
                {!servico.executores.length && (
                  <span className="text-xs text-text-subtle">Sem {texto.min(termos.executor, true)}</span>
                )}
              </div>

              <p className="w-28 shrink-0 text-right font-semibold text-text">
                {formatarMoeda(servico.valor)}
              </p>

              {isAdmin && (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => setServicoExecutoresId(servico.id)}
                    className="rounded-lg p-2 text-text-subtle transition-colors hover:bg-surface hover:text-text"
                    title={`Gerenciar ${texto.min(termos.executor, true)}`}
                  >
                    <UsersIcon size={16} />
                  </button>
                  <button
                    onClick={() => setServicoChecklistId(servico.id)}
                    className="rounded-lg p-2 text-text-subtle transition-colors hover:bg-surface hover:text-text"
                    title="Checklist do relatório"
                  >
                    <ClipboardList size={16} />
                  </button>
                  <button
                    onClick={() => setServicoEditandoId(servico.id)}
                    className="rounded-lg p-2 text-text-subtle transition-colors hover:bg-surface hover:text-text"
                    title="Editar serviço"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => toggleAtivo.mutate(servico)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface hover:text-text"
                  >
                    {servico.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      <ServicoFormModal
        key={servicoEditandoId ?? 'novo'}
        open={formAberto || !!servicoEditandoId}
        servico={servicos?.find((s) => s.id === servicoEditandoId) ?? null}
        empresaId={empresaId}
        onClose={() => {
          setFormAberto(false);
          setServicoEditandoId(null);
        }}
      />

      {(() => {
        const servico = servicos?.find((s) => s.id === servicoExecutoresId);
        return (
          servico && (
            <ExecutoresModal
              servico={servico}
              empresaId={empresaId}
              onClose={() => setServicoExecutoresId(null)}
            />
          )
        );
      })()}

      {(() => {
        const servico = servicos?.find((s) => s.id === servicoChecklistId);
        return (
          servico && (
            <ChecklistModal
              servico={servico}
              empresaId={empresaId}
              onClose={() => setServicoChecklistId(null)}
            />
          )
        );
      })()}
    </div>
  );
}

function ServicoFormModal({
  open,
  servico,
  empresaId,
  onClose,
}: {
  open: boolean;
  servico: Servico | null;
  empresaId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState(servico?.nome ?? '');
  const [descricao, setDescricao] = useState(servico?.descricao ?? '');
  const [valor, setValor] = useState(servico?.valor ?? '');

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { nome, descricao: descricao || undefined, valor: Number(valor) };
      if (servico) {
        return api.patch(`/empresas/${empresaId}/servicos/${servico.id}`, payload);
      }
      return api.post(`/empresas/${empresaId}/servicos`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos', empresaId] });
      onClose();
      setNome('');
      setDescricao('');
      setValor('');
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={servico ? 'Editar serviço' : 'Novo serviço'}
      description="Esses dados aparecem no catálogo visto pela equipe e pelos clientes"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <Input
          label="Descrição"
          value={descricao ?? ''}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <Input
          label="Valor (R$)"
          type="number"
          min="0.01"
          step="0.01"
          required
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        <Button type="submit" loading={mutation.isPending} className="mt-2">
          {servico ? 'Salvar alterações' : 'Criar serviço'}
        </Button>
      </form>
    </Modal>
  );
}

function ExecutoresModal({
  servico,
  empresaId,
  onClose,
}: {
  servico: Servico;
  empresaId: string;
  onClose: () => void;
}) {
  const { termos } = useOutletContext<EmpresaOutletContext>();
  const queryClient = useQueryClient();
  const { data: membros } = useQuery({
    queryKey: ['membros', empresaId],
    queryFn: async () => (await api.get<Membro[]>(`/empresas/${empresaId}/membros`)).data,
  });

  const executores = membros?.filter((m) => m.papel === 'EXECUTOR') ?? [];
  const idsAssociados = new Set(servico.executores.map((e) => e.vinculoExecutorId));

  const adicionar = useMutation({
    mutationFn: async (vinculoExecutorId: string) =>
      api.post(`/empresas/${empresaId}/servicos/${servico.id}/executores`, {
        vinculoExecutorId,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicos', empresaId] }),
  });

  const remover = useMutation({
    mutationFn: async (vinculoExecutorId: string) =>
      api.delete(
        `/empresas/${empresaId}/servicos/${servico.id}/executores/${vinculoExecutorId}`,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['servicos', empresaId] }),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={termos.executor.plural}
      description={`Quem pode ser designado para "${servico.nome}"`}
    >
      <div className="flex flex-col gap-1">
        {!executores.length && (
          <p className="py-4 text-center text-sm text-text-muted">
            Nenhum {texto.min(termos.executor)} cadastrado na equipe ainda.
          </p>
        )}
        {executores.map((membro) => {
          const associado = idsAssociados.has(membro.id);
          return (
            <div
              key={membro.id}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-surface"
            >
              <div className="flex items-center gap-3">
                <Avatar nome={membro.user.nome} size={32} />
                <div>
                  <p className="text-sm font-medium text-text">{membro.user.nome}</p>
                  <p className="text-xs text-text-muted">{membro.user.email}</p>
                </div>
              </div>
              <Button
                variant={associado ? 'secondary' : 'primary'}
                onClick={() =>
                  associado ? remover.mutate(membro.id) : adicionar.mutate(membro.id)
                }
                loading={adicionar.isPending || remover.isPending}
                className="px-3 py-1.5 text-xs"
              >
                {associado ? 'Remover' : 'Adicionar'}
              </Button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function ChecklistModal({
  servico,
  empresaId,
  onClose,
}: {
  servico: Servico;
  empresaId: string;
  onClose: () => void;
}) {
  const { termos } = useOutletContext<EmpresaOutletContext>();
  const queryClient = useQueryClient();
  const [rotulo, setRotulo] = useState('');
  const [tipo, setTipo] = useState<TipoCampoRelatorio>('CHECKBOX');
  const [obrigatorio, setObrigatorio] = useState(false);

  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: ['servicos', empresaId] });

  const adicionar = useMutation({
    mutationFn: async () =>
      api.post(`/empresas/${empresaId}/servicos/${servico.id}/campos-relatorio`, {
        rotulo,
        tipo,
        obrigatorio,
        ordem: servico.camposRelatorio.length,
      }),
    onSuccess: () => {
      invalidar();
      setRotulo('');
      setTipo('CHECKBOX');
      setObrigatorio(false);
    },
  });

  const remover = useMutation({
    mutationFn: async (campoId: string) =>
      api.delete(
        `/empresas/${empresaId}/servicos/${servico.id}/campos-relatorio/${campoId}`,
      ),
    onSuccess: invalidar,
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!rotulo.trim()) return;
    adicionar.mutate();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Checklist do relatório"
      description={`O que o ${texto.min(termos.executor)} preenche ao finalizar "${servico.nome}"`}
    >
      <div className="flex flex-col gap-4">
        {!servico.camposRelatorio.length ? (
          <p className="text-sm text-text-muted">
            Nenhum campo ainda — o relatório terá só observações e fotos.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {servico.camposRelatorio.map((campo) => (
              <div
                key={campo.id}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-surface"
              >
                <div>
                  <p className="text-sm font-medium text-text">
                    {campo.rotulo}
                    {campo.obrigatorio && (
                      <span className="ml-1 text-status-cancelado-text">*</span>
                    )}
                  </p>
                  <p className="text-xs text-text-muted">{TIPO_CAMPO_LABEL[campo.tipo]}</p>
                </div>
                <button
                  onClick={() => remover.mutate(campo.id)}
                  className="rounded-lg p-2 text-text-subtle transition-colors hover:bg-status-cancelado-bg hover:text-status-cancelado-text"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-border pt-4">
          <Input
            label="Novo campo"
            placeholder="Ex: Bebeu água"
            value={rotulo}
            onChange={(e) => setRotulo(e.target.value)}
          />
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-text">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoCampoRelatorio)}
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary-light"
              >
                {Object.entries(TIPO_CAMPO_LABEL).map(([valor, label]) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <label className="mb-2.5 flex items-center gap-2 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={obrigatorio}
                onChange={(e) => setObrigatorio(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              Obrigatório
            </label>
          </div>
          <Button type="submit" variant="secondary" loading={adicionar.isPending}>
            Adicionar campo
          </Button>
        </form>
      </div>
    </Modal>
  );
}
