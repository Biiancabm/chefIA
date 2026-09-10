import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { api } from '../lib/api';
import { iniciais } from '../lib/format';
import type { MinhaEmpresa } from '../types';

const PAPEL_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  EXECUTOR: 'Executor',
  CLIENTE: 'Cliente',
};

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
            Empresas onde você é administrador, executor ou cliente
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
          onCriada={() => setMostrarForm(false)}
        />
      )}

      {!semEmpresas && (
        <div className="grid gap-4 sm:grid-cols-2">
          {empresas.map(({ empresa, papel }) => (
            <Link key={empresa.id} to={`/empresas/${empresa.id}`}>
              <Card className="flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)]">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white">
                  {iniciais(empresa.nome)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-medium text-text">{empresa.nome}</h2>
                  <span className="mt-1 inline-flex rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary-hover">
                    {PAPEL_LABEL[papel]}
                  </span>
                </div>
                <ChevronRight size={18} className="shrink-0 text-text-subtle" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function NovaEmpresaCard({
  destaque,
  onCriada,
}: {
  destaque: boolean;
  onCriada: () => void;
}) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const mutation = useMutation({
    mutationFn: async () => (await api.post('/empresas', { nome })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhas-empresas'] });
      setNome('');
      onCriada();
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <Card className={destaque ? 'bg-surface' : ''}>
      <h2 className="mb-1 font-medium text-text">
        {destaque ? 'Crie sua empresa' : 'Nova empresa'}
      </h2>
      <p className="mb-4 text-sm text-text-muted">
        Você se torna administrador dela automaticamente
      </p>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          placeholder="Nome da empresa"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" loading={mutation.isPending}>
          Criar
        </Button>
      </form>
    </Card>
  );
}
