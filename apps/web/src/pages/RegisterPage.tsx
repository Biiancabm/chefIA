import { mensagemDaApi } from '../lib/erros';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout, Erro } from '../components/AuthLayout';
import { Button } from '../components/ui/Button';
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

  const linkLogin = `/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await registrar({ nome, email, senha });
      navigate(redirect);
    } catch (err) {
      setErro(mensagemDaApi(err, 'Não foi possível criar a conta. Tente de novo.'));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthLayout
      titulo="Criar conta"
      subtitulo="Leva menos de um minuto. Depois é só criar sua empresa ou aceitar um convite."
      topo={
        <Link to={linkLogin} className="hidden font-medium text-primary-text hover:underline sm:inline">
          Entrar
        </Link>
      }
      rodape={
        <>
          Já tem conta?{' '}
          <Link to={linkLogin} className="font-medium text-primary-text underline-offset-4 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome"
          name="nome"
          placeholder="Seu nome completo"
          autoComplete="name"

          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="voce@exemplo.com"
          autoComplete="email"

          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Senha"
          name="senha"
          type="password"
          dica="Mínimo de 6 caracteres"
          autoComplete="new-password"

          required
          minLength={6}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        {erro && <Erro texto={erro} />}
        <Button type="submit" loading={carregando} className="mt-1 h-10 w-full">
          Criar conta
        </Button>
      </form>
    </AuthLayout>
  );
}
