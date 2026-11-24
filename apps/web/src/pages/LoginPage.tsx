import { erroDeConexao } from '../lib/erros';
import { ArrowRight } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout, Erro } from '../components/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../lib/auth-context';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(true);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  if (user) return <Navigate to={redirect} replace />;

  const linkCadastro = `/registro${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login({ email, senha, lembrar });
      navigate(redirect);
    } catch (err) {
      setErro(erroDeConexao(err) ?? 'Email ou senha incorretos. Confira e tente de novo.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthLayout
      titulo="Entrar"
      subtitulo="Acesse suas empresas, sua agenda e seus relatórios."
      topo={
        <Link
          to={linkCadastro}
          className="hidden font-medium text-primary-text hover:underline sm:inline"
        >
          Criar conta
        </Link>
      }
      rodape={
        <>
          Ainda não tem conta?{' '}
          <Link to={linkCadastro} className="font-medium text-primary-text underline-offset-4 hover:underline">
            Cadastre-se
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="senha" className="rotulo mb-0">
              Senha
            </label>
            <Link to="/esqueci-senha" className="text-[13px] font-medium text-primary-text hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
          <Input
            id="senha"
            type="password"
            autoComplete="current-password"

            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={lembrar}
            onChange={(e) => setLembrar(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          Manter conectado neste aparelho
        </label>

        {erro && <Erro texto={erro} />}

        <Button type="submit" loading={carregando} className="mt-1 h-10 w-full">
          Entrar
          {!carregando && <ArrowRight size={16} />}
        </Button>
      </form>
    </AuthLayout>
  );
}
