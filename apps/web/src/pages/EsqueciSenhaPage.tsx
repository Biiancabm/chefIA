import { ArrowLeft } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout, Sucesso } from '../components/AuthLayout';
import { Button } from '../components/ui/Button';
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
    <AuthLayout
      titulo="Recuperar senha"
      subtitulo="Informe seu email e enviaremos um link para criar uma nova senha."
      rodape={
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-text hover:underline">
          <ArrowLeft size={15} />
          Voltar para o login
        </Link>
      }
    >
      {enviado ? (
        <Sucesso>
          Se <strong className="font-semibold">{email}</strong> estiver cadastrado, o link chega em
          instantes. Ele vale por 1 hora.
        </Sucesso>
      ) : (
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
          <Button type="submit" loading={carregando} className="mt-1 h-10 w-full">
            Enviar link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
