import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../lib/auth-context';

export function RegisterPage() {
  const { user, registrar } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  if (user) return <Navigate to={redirect} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await registrar({ nome, email, senha });
      navigate(redirect);
    } catch (err: any) {
      setErro(err.response?.data?.message ?? 'Não foi possível criar a conta');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold text-text">Criar conta</h1>
        <p className="mb-6 text-sm text-text-muted">
          Comece a usar a Universal
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nome"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Senha"
            type="password"
            required
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          {erro && <p className="text-sm text-status-cancelado-text">{erro}</p>}
          <Button type="submit" loading={carregando} className="mt-2 w-full">
            Criar conta
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-text-muted">
          Já tem conta?{' '}
          <Link
            to={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="font-medium text-primary hover:underline"
          >
            Entrar
          </Link>
        </p>
      </Card>
    </div>
  );
}
