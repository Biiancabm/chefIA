import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, Plus, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmpresaMarca, LogoCampo } from '../components/EmpresaMarca';
import { AvisoInstalarApp } from '../components/InstalarApp';
import { RemuneracaoPicker } from '../components/RemuneracaoPicker';
import { Tag } from '../components/ui/Badge';
import { Button, IconButton } from '../components/ui/Button';
import { PageHeader, SectionTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { configSegmento, nomePapel } from '../lib/segmentos';
import type { Empresa, MinhaEmpresa, ModeloRemuneracao } from '../types';

function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function DashboardPage() {
  const { user } = useAuth();
  const [mostrarForm, setMostrarForm] = useState(false);
  const { data: empresas, isLoading } = useQuery({
    queryKey: ['minhas-empresas'],
    queryFn: async () => (await api.get<MinhaEmpresa[]>('/empresas')).data,
  });

  const primeiroNome = user?.nome.split(' ')[0] ?? '';
  const semEmpresas = !isLoading && (!empresas || empresas.length === 0);
  // Mesma regra da API: só cria empresa quem ainda não tem nenhuma ou já é admin em alguma
  const podeCriar = semEmpresas || !!empresas?.some((e) => e.papel === 'ADMIN');

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo={`${saudacao()}, ${primeiroNome}`}
        descricao={<span className="inline-block first-letter:uppercase">{hoje}</span>}
        acoes={
          podeCriar &&
          !semEmpresas &&
          !mostrarForm && (
            <Button onClick={() => setMostrarForm(true)}>
              <Plus size={16} />
              Nova empresa
            </Button>
          )
        }
      />

      <AvisoInstalarApp />

      {podeCriar && (semEmpresas || mostrarForm) && (
        <NovaEmpresa primeira={semEmpresas} onCancelar={semEmpresas ? undefined : () => setMostrarForm(false)} />
      )}

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3" aria-busy>
          {[0, 1].map((i) => (
            <div key={i} className="flex min-h-[232px] flex-col rounded-xl border border-border bg-panel p-6">
              <div className="h-[72px] w-[72px] animate-pulse rounded-2xl bg-surface" />
              <div className="mt-6 h-5 w-48 animate-pulse rounded bg-surface" />
              <div className="mt-2.5 h-3 w-64 max-w-full animate-pulse rounded bg-surface" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !semEmpresas && (
        <section>
          <SectionTitle contagem={empresas!.length}>Suas empresas</SectionTitle>
          <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {empresas!.map(({ empresa, papel }) => (
              <EmpresaLinha key={empresa.id} empresa={empresa} papel={papel} />
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-text-subtle">
            Você entra em outras empresas pelo link de convite que o administrador envia.
          </p>
        </section>
      )}
    </div>
  );
}

function EmpresaLinha({ empresa, papel }: Pick<MinhaEmpresa, 'empresa' | 'papel'>) {
  const config = configSegmento(empresa.segmento);
  return (
    <li>
      <Link
        to={`/empresas/${empresa.id}`}
        className="group flex h-full min-h-[232px] flex-col rounded-xl border border-border bg-panel p-6 shadow-card transition-colors duration-150 hover:border-primary-line hover:bg-primary-soft/30"
      >
        <span className="flex items-start justify-between gap-4">
          <EmpresaMarca empresa={empresa} tamanho={72} />
          <Tag tom="acento">{nomePapel(empresa.segmento, papel)}</Tag>
        </span>
        <span className="mb-6 mt-5 block min-w-0">
          <span className="block truncate text-xl font-semibold tracking-[-0.01em] text-text">{empresa.nome}</span>
          <span className="mt-1 block text-sm text-text-muted">
            {config.label} · {config.descricao}
          </span>
        </span>
        <span className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-[13px] text-text-subtle">
            Desde {new Date(empresa.criadoEm).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-primary-text">
            Entrar
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </span>
      </Link>
    </li>
  );
}

function NovaEmpresa({ primeira, onCancelar }: { primeira: boolean; onCancelar?: () => void }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [modelo, setModelo] = useState<ModeloRemuneracao>('COMISSAO');
  const [criarSugeridos, setCriarSugeridos] = useState(true);

  const mutation = useMutation({
    mutationFn: async () =>
      (
        await api.post<Empresa>('/empresas', {
          nome,
          logoUrl,
          modeloRemuneracao: modelo,
          criarServicosSugeridos: criarSugeridos,
        })
      ).data,
    onSuccess: async (empresa) => {
      await queryClient.invalidateQueries({ queryKey: ['minhas-empresas'] });
      navigate(`/empresas/${empresa.id}`);
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <section className="animate-[surgir_220ms_cubic-bezier(0.16,1,0.3,1)] rounded-xl border border-border bg-panel shadow-card">
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-[15px] font-semibold text-text">
            {primeira ? 'Crie sua primeira empresa' : 'Nova empresa'}
          </h2>
          <p className="mt-0.5 text-[13px] text-text-muted">
            {primeira
              ? 'Ou, se você trabalha para alguém, abra o link de convite que recebeu.'
              : 'Você vira administrador dela automaticamente.'}
          </p>
        </div>
        {onCancelar && (
          <IconButton label="Fechar" onClick={onCancelar}>
            <X size={17} />
          </IconButton>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-5 py-5 sm:px-6">
        <div className="grid gap-6 md:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] md:items-start">
          <Input
            label="Nome da empresa"
            name="nomeEmpresa"
            placeholder="Ex.: Patas Felizes Passeios"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
          <LogoCampo valor={logoUrl} onChange={setLogoUrl} segmento="PET" />
        </div>

        <div>
          <p className="rotulo">Como você paga os passeadores?</p>
          <p className="mb-3 text-[13px] text-text-muted">
            Isso define como o Financeiro calcula o que cada passeador recebe e o que fica para a empresa. Dá para mudar
            depois em Dados da empresa.
          </p>
          <RemuneracaoPicker value={modelo} onChange={setModelo} />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3.5 text-sm text-text">
          <input
            type="checkbox"
            checked={criarSugeridos}
            onChange={(e) => setCriarSugeridos(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded"
          />
          <span>
            Já criar os serviços de pets mais comuns
            <span className="mt-0.5 block text-[13px] text-text-muted">
              Passeio de 30 min, passeio de 1 h e visita pet sitter, com valores e checklist de relatório prontos. Dá
              para editar tudo depois.
            </span>
          </span>
        </label>

        {mutation.isError && (
          <p role="alert" className="text-sm text-danger">
            Não foi possível criar a empresa. Tente de novo.
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-border pt-5">
          {onCancelar && (
            <Button type="button" variant="ghost" onClick={onCancelar}>
              Cancelar
            </Button>
          )}
          <Button type="submit" loading={mutation.isPending}>
            Criar empresa
            {!mutation.isPending && <ArrowUpRight size={15} />}
          </Button>
        </div>
      </form>
    </section>
  );
}
