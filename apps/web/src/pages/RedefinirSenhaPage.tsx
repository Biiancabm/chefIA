import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
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
      setErro('As senhas não coincidem');
      return;
    }

    setCarregando(true);
    try {
      await api.post('/auth/redefinir-senha', { token, novaSenha });
      setConcluido(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setErro(
        err.response?.data?.message ?? 'Não foi possível redefinir a senha',
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold text-text">Redefinir senha</h1>
        <p className="mb-6 text-sm text-text-muted">Escolha uma nova senha</p>

        {concluido ? (
          <p className="text-sm text-text">
            Senha redefinida com sucesso. Redirecionando para o login...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Nova senha"
              type="password"
              required
              minLength={6}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
            />
            <Input
              label="Confirmar nova senha"
              type="password"
              required
              minLength={6}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
            />
            {erro && <p className="text-sm text-status-cancelado-text">{erro}</p>}
            <Button type="submit" loading={carregando} className="mt-2 w-full">
              Redefinir senha
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-text-muted">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Voltar para o login
          </Link>
        </p>
      </Card>
    </div>
  );
}
