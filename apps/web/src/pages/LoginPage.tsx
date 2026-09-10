import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../lib/auth-context';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
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
      await login({ email, senha });
      navigate(redirect);
    } catch {
      setErro('Email ou senha inválidos');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold text-text">Entrar</h1>
        <p className="mb-6 text-sm text-text-muted">
          Acesse sua conta na Universal
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div>
            <Input
              label="Senha"
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <Link
              to="/esqueci-senha"
              className="mt-1.5 inline-block text-sm text-primary hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          {erro && <p className="text-sm text-status-cancelado-text">{erro}</p>}
          <Button type="submit" loading={carregando} className="mt-2 w-full">
            Entrar
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-text-muted">
          Não tem conta?{' '}
          <Link
            to={`/registro${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="font-medium text-primary hover:underline"
          >
            Cadastre-se
          </Link>
        </p>
      </Card>
    </div>
  );
}
