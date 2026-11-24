import { useMutation, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { Building2, Link2Off } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { configSegmento, nomePapel } from '../lib/segmentos';
import type { PapelVinculo, Segmento } from '../types';

export function ConviteAceitarPage() {
  const { token } = useParams<{ token: string }>();
  const { user, carregando } = useAuth();
  const navigate = useNavigate();

  const { data: convite, isLoading, isError } = useQuery({
    queryKey: ['convite', token],
    queryFn: async () =>
      (
        await api.get<{ empresa: { id: string; nome: string; segmento: Segmento }; papel: PapelVinculo }>(
          `/convites/${token}`,
        )
      ).data,
    retry: false,
  });

  const segmento = convite?.empresa.segmento ?? null;
  const config = segmento ? configSegmento(segmento) : null;
  const Icone = config?.icon ?? Building2;

  const aceitar = useMutation({
    mutationFn: async () => api.post(`/convites/${token}/aceitar`),
    onSuccess: () => navigate(`/empresas/${convite?.empresa.id}`),
  });

  return (
    <div className="flex min-h-dvh flex-col bg-background px-5 py-5">
      <div className="flex h-10 w-full items-center">
        <Logo tamanho={26} />
      </div>

      <div className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-[400px] animate-[surgir_300ms_cubic-bezier(0.16,1,0.3,1)] rounded-xl border border-border bg-panel shadow-card">
          {isLoading || carregando ? (
            <div className="flex flex-col gap-3 p-7">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-surface" />
              <div className="h-5 w-2/3 animate-pulse rounded bg-surface" />
              <div className="h-4 w-full animate-pulse rounded bg-surface" />
            </div>
          ) : isError || !convite ? (
            <div className="p-7">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-text-muted">
                <Link2Off size={18} />
              </div>
              <h1 className="text-lg font-semibold tracking-[-0.02em] text-text">Convite indisponível</h1>
              <p className="mt-1.5 text-sm text-text-muted">
                Esse link expirou ou já foi usado. Peça um novo convite para quem administra a empresa.
              </p>
              <Link to="/" className="mt-6 inline-block text-sm font-medium text-text underline underline-offset-4">
                Ir para o início
              </Link>
            </div>
          ) : (
            <>
              <div className="p-7">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white">
                  <Icone size={20} strokeWidth={1.9} />
                </div>
                <p className="text-sm text-text-muted">Você foi convidado para</p>
                <h1 className="mt-0.5 text-[22px] font-semibold leading-tight tracking-[-0.025em] text-text">
                  {convite.empresa.nome}
                </h1>
                <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border text-sm">
                  <div className="bg-panel px-3.5 py-2.5">
                    <dt className="text-xs text-text-subtle">Entrar como</dt>
                    <dd className="mt-0.5 font-medium text-text">
                      {nomePapel(convite.empresa.segmento, convite.papel)}
                    </dd>
                  </div>
                  <div className="bg-panel px-3.5 py-2.5">
                    <dt className="text-xs text-text-subtle">Ramo</dt>
                    <dd className="mt-0.5 truncate font-medium text-text">{config?.label}</dd>
                  </div>
                </dl>
              </div>

              <div className="border-t border-border p-5">
                {user ? (
                  <Button tamanho="lg" onClick={() => aceitar.mutate()} loading={aceitar.isPending} className="w-full">
                    Aceitar convite
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link to={`/login?redirect=/convites/${token}`}>
                      <Button tamanho="lg" className="w-full">
                        Entrar para aceitar
                      </Button>
                    </Link>
                    <Link to={`/registro?redirect=/convites/${token}`}>
                      <Button tamanho="lg" variant="secondary" className="w-full">
                        Criar conta
                      </Button>
                    </Link>
                  </div>
                )}
                {aceitar.isError && (
                  <p role="alert" className="mt-3 text-sm text-danger">
                    {(aceitar.error as AxiosError<{ message?: string }>).response?.data?.message ??
                      'Não foi possível aceitar esse convite.'}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
