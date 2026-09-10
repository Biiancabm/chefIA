import { useMutation, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { Building2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';

const PAPEL_LABEL: Record<string, string> = {
  ADMIN: 'administrador',
  EXECUTOR: 'executor',
  CLIENTE: 'cliente',
};

export function ConviteAceitarPage() {
  const { token } = useParams<{ token: string }>();
  const { user, carregando } = useAuth();
  const navigate = useNavigate();

  const { data: convite, isLoading, isError } = useQuery({
    queryKey: ['convite', token],
    queryFn: async () =>
      (await api.get<{ empresa: { id: string; nome: string }; papel: string }>(
        `/convites/${token}`,
      )).data,
    retry: false,
  });

  const aceitar = useMutation({
    mutationFn: async () => api.post(`/convites/${token}/aceitar`),
    onSuccess: () => navigate(`/empresas/${convite?.empresa.id}`),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <Card className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
          <Building2 size={22} strokeWidth={1.75} />
        </div>

        {isLoading || carregando ? (
          <p className="text-sm text-text-muted">Carregando convite...</p>
        ) : isError || !convite ? (
          <>
            <h1 className="mb-1 text-lg font-semibold text-text">Convite inválido</h1>
            <p className="text-sm text-text-muted">
              Esse link expirou ou não existe mais.
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-lg font-semibold text-text">
              {convite.empresa.nome}
            </h1>
            <p className="mb-6 text-sm text-text-muted">
              Você foi convidado para entrar como{' '}
              <strong className="text-text">{PAPEL_LABEL[convite.papel]}</strong>
            </p>

            {user ? (
              <Button
                onClick={() => aceitar.mutate()}
                loading={aceitar.isPending}
                className="w-full"
              >
                Aceitar convite
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to={`/login?redirect=/convites/${token}`}>
                  <Button className="w-full">Entrar para aceitar</Button>
                </Link>
                <Link to={`/registro?redirect=/convites/${token}`}>
                  <Button variant="secondary" className="w-full">
                    Criar conta
                  </Button>
                </Link>
              </div>
            )}
            {aceitar.isError && (
              <p className="mt-3 text-sm text-status-cancelado-text">
                {(aceitar.error as AxiosError<{ message?: string }>).response?.data
                  ?.message ?? 'Não foi possível aceitar esse convite.'}
              </p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
