import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SegmentoPicker } from '../components/SegmentoPicker';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { api } from '../lib/api';
import { configSegmento, nomePapel } from '../lib/segmentos';
import type { Empresa, MinhaEmpresa, Segmento } from '../types';

export function DashboardPage() {
  const [mostrarForm, setMostrarForm] = useState(false);
  const { data: empresas, isLoading } = useQuery({
    queryKey: ['minhas-empresas'],
    queryFn: async () => (await api.get<MinhaEmpresa[]>('/empresas')).data,
  });

  if (isLoading) {
    return <p className="text-text-muted">Carregando suas empresas...</p>;
  }

  const semEmpresas = !empresas || empresas.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Minhas empresas</h1>
          <p className="text-sm text-text-muted">
            Empresas onde você trabalha, administra ou é cliente
          </p>
        </div>
        {!semEmpresas && (
          <Button variant="secondary" onClick={() => setMostrarForm((v) => !v)}>
            <Plus size={16} />
            Nova empresa
          </Button>
        )}
      </div>

      {(semEmpresas || mostrarForm) && (
        <NovaEmpresaCard
          destaque={semEmpresas}
          onCancelar={semEmpresas ? undefined : () => setMostrarForm(false)}
        />
      )}

      {!semEmpresas && (
        <div className="grid gap-4 sm:grid-cols-2">
          {empresas.map(({ empresa, papel }) => {
            const config = configSegmento(empresa.segmento);
            return (
              <Link key={empresa.id} to={`/empresas/${empresa.id}`}>
                <Card className="flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)]">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: config.cores.primary }}
                  >
                    <config.icon size={22} strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-medium text-text">{empresa.nome}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: config.cores.light, color: config.cores.hover }}
                      >
                        {nomePapel(empresa.segmento, papel)}
                      </span>
                      <span className="text-xs text-text-subtle">{config.label}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-text-subtle" />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NovaEmpresaCard({
  destaque,
  onCancelar,
}: {
  destaque: boolean;
  onCancelar?: () => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [segmento, setSegmento] = useState<Segmento | null>(null);
  const [criarSugeridos, setCriarSugeridos] = useState(true);
  const [erro, setErro] = useState('');

  const mutation = useMutation({
    mutationFn: async () =>
      (
        await api.post<Empresa>('/empresas', {
          nome,
          segmento,
          criarServicosSugeridos: segmento !== 'OUTRO' && criarSugeridos,
        })
      ).data,
    onSuccess: async (empresa) => {
      await queryClient.invalidateQueries({ queryKey: ['minhas-empresas'] });
      navigate(`/empresas/${empresa.id}`);
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!segmento) {
      setErro('Escolha o ramo de atividade da empresa');
      return;
    }
    setErro('');
    mutation.mutate();
  }

  const config = segmento ? configSegmento(segmento) : null;

  return (
    <Card className={destaque ? 'bg-surface' : ''}>
      <h2 className="mb-1 font-medium text-text">
        {destaque ? 'Crie sua empresa' : 'Nova empresa'}
      </h2>
      <p className="mb-5 text-sm text-text-muted">
        Você se torna administrador dela automaticamente
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">Nome da empresa</label>
          <Input
            placeholder="Ex.: Patas Felizes Passeios"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">
            O que a sua empresa faz?
          </label>
          <p className="mb-3 text-xs text-text-muted">
            O site se adapta ao seu ramo: nomes das telas, cores e serviços prontos para usar.
          </p>
          <SegmentoPicker value={segmento} onChange={setSegmento} />
          {erro && <p className="mt-2 text-sm text-status-cancelado-text">{erro}</p>}
        </div>

        {config && segmento !== 'OUTRO' && (
          <label className="flex items-start gap-2.5 rounded-xl bg-background p-3 text-sm text-text ring-1 ring-border">
            <input
              type="checkbox"
              checked={criarSugeridos}
              onChange={(e) => setCriarSugeridos(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border"
              style={{ accentColor: config.cores.primary }}
            />
            <span>
              Já criar serviços sugeridos para {config.label.toLowerCase()}
              <span className="block text-xs text-text-muted">
                Com valores e checklist de relatório prontos. Você pode editar tudo depois.
              </span>
            </span>
          </label>
        )}

        <div className="flex justify-end gap-2">
          {onCancelar && (
            <Button type="button" variant="ghost" onClick={onCancelar}>
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            loading={mutation.isPending}
            style={config ? { backgroundColor: config.cores.primary } : undefined}
          >
            Criar empresa
          </Button>
        </div>
      </form>
    </Card>
  );
}
