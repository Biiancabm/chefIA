import { Outlet, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';

export function Layout() {
  const { user, carregando, sair } = useAuth();

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center text-text-muted">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
              U
            </div>
            <span className="text-lg font-semibold text-text">Universal</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-text-muted sm:inline">{user.nome}</span>
            <Avatar nome={user.nome} size={32} />
            <Button variant="ghost" onClick={sair}>
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
