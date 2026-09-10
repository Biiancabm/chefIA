import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { api } from '../lib/api';

export function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      await api.post('/auth/esqueci-senha', { email });
    } finally {
      setCarregando(false);
      setEnviado(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold text-text">Esqueci minha senha</h1>
        <p className="mb-6 text-sm text-text-muted">
          Informe seu email e enviaremos um link para redefinir a senha
        </p>

        {enviado ? (
          <p className="text-sm text-text">
            Se esse email estiver cadastrado, você vai receber um link para redefinir
            a senha em instantes.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" loading={carregando} className="mt-2 w-full">
              Enviar link
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
