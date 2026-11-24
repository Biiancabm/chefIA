import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button, IconButton } from '../../components/ui/Button';
import { PageHeader, Skeleton } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../lib/api';
import { FotoAssistido, ListasBriefing } from '../../components/Assistido';
import { FotoUnicaUpload } from '../../components/FotosUpload';
import { configSegmento, resumoDados, texto, type ConfigAssistido } from '../../lib/segmentos';
import type { Assistido, Membro } from '../../types';
import type { EmpresaOutletContext } from './EmpresaLayout';

export function AssistidosPage() {
  const { empresaId, papel, segmento, termos } = useOutletContext<EmpresaOutletContext>();
  const config = configSegmento(segmento).assistido;
  const [editando, setEditando] = useState<Assistido | 'novo' | null>(null);

  const { data: assistidos, isLoading } = useQuery({
    queryKey: ['assistidos', empresaId],
    queryFn: async () => (await api.get<Assistido[]>(`/empresas/${empresaId}/assistidos`)).data,
    enabled: !!config,
  });

  if (!config) {
    return <p className="text-sm text-text-muted">Esse ramo não usa esse cadastro.</p>;
  }

  const termo = config.termo;
  const podeCriar = papel === 'ADMIN' || papel === 'CLIENTE';

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        titulo={papel === 'CLIENTE' ? texto.meus(termo) : termo.plural}
        descricao={
          papel === 'CLIENTE'
            ? `O que ${texto.o(termos.executor)} precisa saber antes de cada ${texto.min(termos.ordem)}`
            : `${termo.plural} dos ${texto.min(termos.cliente, true)} e o briefing de cada ${texto.min(termo)}`
        }
        acoes={
          podeCriar && (
            <Button onClick={() => setEditando('novo')}>
              <Plus size={16} />
              {texto.novo(termo)}
            </Button>
          )
        }
      />

      {isLoading ? (
        <Skeleton linhas={3} />
      ) : !assistidos?.length ? (
        <EmptyState
          icon={config.icon}
          title={`${texto.nenhum(termo)} ${texto.cadastrado(termo)}`}
          description={
            podeCriar
              ? `Cadastre ${texto.o(termo)} com foto e o que ${texto.o(termos.executor)} precisa saber.`
              : `Os ${texto.min(termo, true)} dos seus ${texto.min(termos.cliente, true)} aparecem aqui.`
          }
          action={
            podeCriar ? (
              <Button variant="secondary" onClick={() => setEditando('novo')}>
                <Plus size={15} />
                {texto.novo(termo)}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {assistidos.map((a) => (
            <CartaoAssistido
              key={a.id}
              assistido={a}
              config={config}
              mostrarDono={papel !== 'CLIENTE'}
              onEditar={() => setEditando(a)}
            />
          ))}
        </div>
      )}

      {editando && (
        <AssistidoModal config={config} assistido={editando === 'novo' ? null : editando} onClose={() => setEditando(null)} />
      )}
    </div>
  );
}

function CartaoAssistido({
  assistido,
  config,
  mostrarDono,
  onEditar,
}: {
  assistido: Assistido;
  config: ConfigAssistido;
  mostrarDono: boolean;
  onEditar: () => void;
}) {
  const resumo = resumoDados(assistido.dados, config);
  const temBriefing = !!assistido.informacoes.length || !!assistido.lembretes.length;
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-panel shadow-card">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
        <FotoAssistido assistido={assistido} config={config} tamanho={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-text">{assistido.nome}</p>
          {resumo && <p className="truncate text-[13px] text-text-muted">{resumo}</p>}
          {mostrarDono && assistido.vinculoCliente && (
            <p className="truncate text-xs text-text-subtle">{assistido.vinculoCliente.user.nome}</p>
          )}
        </div>
        <IconButton label={`Editar ${assistido.nome}`} onClick={onEditar}>
          <Pencil size={15} />
        </IconButton>
      </div>
      <div className="flex-1 px-4 py-3.5">
        {temBriefing ? (
          <ListasBriefing assistido={assistido} compacto />
        ) : (
          <p className="text-[13px] text-text-subtle">Sem briefing. Adicione informações e lembretes.</p>
        )}
      </div>
    </article>
  );
}

const linhas = (textoLivre: string) =>
  textoLivre
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

function AssistidoModal({
  config,
  assistido,
  onClose,
}: {
  config: ConfigAssistido;
  assistido: Assistido | null;
  onClose: () => void;
}) {
  const { empresaId, papel, termos } = useOutletContext<EmpresaOutletContext>();
  const queryClient = useQueryClient();
  const termo = config.termo;
  const [nome, setNome] = useState(assistido?.nome ?? '');
  const [fotoUrl, setFotoUrl] = useState(assistido?.fotoUrl ?? '');
  const [dados, setDados] = useState<Record<string, string>>(assistido?.dados ?? {});
  const [informacoes, setInformacoes] = useState(assistido?.informacoes.join('\n') ?? '');
  const [lembretes, setLembretes] = useState(assistido?.lembretes.join('\n') ?? '');
  const [vinculoClienteId, setVinculoClienteId] = useState('');
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);

  // Só o admin escolhe o cliente (o cliente cadastra para si mesmo)
  const precisaEscolherCliente = !assistido && papel === 'ADMIN';
  const { data: clientes } = useQuery({
    queryKey: ['clientes', empresaId],
    queryFn: async () => (await api.get<Membro[]>(`/empresas/${empresaId}/clientes`)).data,
    enabled: precisaEscolherCliente,
  });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['assistidos', empresaId] });
    onClose();
  };

  const salvar = useMutation({
    mutationFn: async () => {
      const corpo = {
        nome,
        // Só manda a foto se mudou (cadastros antigos podem ter um link de fora)
        ...(fotoUrl !== (assistido?.fotoUrl ?? '') ? { fotoUrl } : {}),
        dados,
        informacoes: linhas(informacoes),
        lembretes: linhas(lembretes),
      };
      return assistido
        ? api.patch(`/empresas/${empresaId}/assistidos/${assistido.id}`, corpo)
        : api.post(`/empresas/${empresaId}/assistidos`, {
            ...corpo,
            vinculoClienteId: precisaEscolherCliente ? vinculoClienteId : undefined,
          });
    },
    onSuccess: invalidar,
  });

  const remover = useMutation({
    mutationFn: async () => api.delete(`/empresas/${empresaId}/assistidos/${assistido!.id}`),
    onSuccess: invalidar,
  });

  const podeRemover = !!assistido && (papel === 'ADMIN' || papel === 'CLIENTE');
  const erro = (salvar.error ?? remover.error) as AxiosError<{ message?: string | string[] }> | null;
  const mensagemErro = erro?.response?.data?.message;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    salvar.mutate();
  }

  const classeCampo = 'campo';

  return (
    <Modal
      open
      onClose={onClose}
      title={assistido ? `Editar ${texto.min(termo)}` : texto.novo(termo)}
      description={`O briefing aparece para ${texto.o(termos.executor)} antes de cada ${texto.min(termos.ordem)}.`}
      largo
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {precisaEscolherCliente && (
          <div>
            <label className="rotulo">Cliente</label>
            <select
              required
              value={vinculoClienteId}
              onChange={(e) => setVinculoClienteId(e.target.value)}
              className={classeCampo}
            >
              <option value="">Selecione...</option>
              {clientes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.user.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        <Input label="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} />

        <div>
          <p className="rotulo">
            Foto <span className="font-normal text-text-subtle">(opcional)</span>
          </p>
          <FotoUnicaUpload
            valor={fotoUrl}
            onChange={setFotoUrl}
            previa={
              <FotoAssistido
                key={fotoUrl}
                assistido={{ nome, fotoUrl: fotoUrl || null }}
                config={config}
                tamanho={64}
              />
            }
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {config.campos.map((campo) => (
            <div key={campo.chave}>
              <label className="rotulo">{campo.rotulo}</label>
              {campo.opcoes ? (
                <select
                  value={dados[campo.chave] ?? ''}
                  onChange={(e) => setDados((d) => ({ ...d, [campo.chave]: e.target.value }))}
                  className={classeCampo}
                >
                  <option value="">—</option>
                  {campo.opcoes.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={dados[campo.chave] ?? ''}
                  placeholder={campo.placeholder}
                  onChange={(e) => setDados((d) => ({ ...d, [campo.chave]: e.target.value }))}
                  className={classeCampo}
                />
              )}
            </div>
          ))}
        </div>

        <div>
          <label className="rotulo mb-0.5!">Informações importantes</label>
          <p className="mb-2 text-xs text-text-subtle">Uma por linha</p>
          <textarea
            rows={3}
            value={informacoes}
            placeholder={config.exemploInformacao}
            onChange={(e) => setInformacoes(e.target.value)}
            className={classeCampo}
          />
        </div>

        <div>
          <label className="rotulo mb-0.5!">Lembretes</label>
          <p className="mb-2 text-xs text-text-subtle">Um por linha</p>
          <textarea
            rows={3}
            value={lembretes}
            placeholder={config.exemploLembrete}
            onChange={(e) => setLembretes(e.target.value)}
            className={classeCampo}
          />
        </div>

        {mensagemErro && (
          <p className="text-sm text-danger">
            {Array.isArray(mensagemErro) ? mensagemErro[0] : mensagemErro}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {podeRemover ? (
            confirmandoRemocao ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">Remover {texto.o(termo)}?</span>
                <Button
                  type="button"
                  variant="danger"
                  loading={remover.isPending}
                  onClick={() => remover.mutate()}
                >
                  Remover
                </Button>
                <Button type="button" variant="ghost" onClick={() => setConfirmandoRemocao(false)}>
                  Não
                </Button>
              </div>
            ) : (
              <Button type="button" variant="ghost" onClick={() => setConfirmandoRemocao(true)}>
                <Trash2 size={15} />
                Remover
              </Button>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={salvar.isPending}>
              Salvar
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
