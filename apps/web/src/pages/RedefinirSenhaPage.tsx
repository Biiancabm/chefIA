import { ArrowLeft } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthLayout, Erro, Sucesso } from '../components/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../lib/api';

export function RedefinirSenhaPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [concluido, setConcluido] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');

    if (novaSenha !== confirmarSenha) {
      setErro('As duas senhas não são iguais.');
      return;
    }

    setCarregando(true);
    try {
      await api.post('/auth/redefinir-senha', { token, novaSenha });
      setConcluido(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setErro(err.response?.data?.message ?? 'Não foi possível redefinir a senha. Peça um novo link.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthLayout
      titulo="Nova senha"
      subtitulo="Escolha uma senha que você não use em outros sites."
      rodape={
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-text hover:underline">
          <ArrowLeft size={15} />
          Voltar para o login
        </Link>
      }
    >
      {concluido ? (
        <Sucesso>Senha redefinida. Levando você para o login…</Sucesso>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nova senha"
            name="novaSenha"
            type="password"
            dica="Mínimo de 6 caracteres"
            autoComplete="new-password"

            required
            minLength={6}
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
          />
          <Input
            label="Confirmar nova senha"
            name="confirmarSenha"
            type="password"
            autoComplete="new-password"

            required
            minLength={6}
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
          />
          {erro && <Erro texto={erro} />}
          <Button type="submit" loading={carregando} className="mt-1 h-10 w-full">
            Salvar nova senha
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
