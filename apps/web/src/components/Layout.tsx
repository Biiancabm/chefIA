import { Link, Navigate, Outlet, useMatch } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { Logo, LogoMarca } from './Logo';
import { UserMenu } from './UserMenu';

export function Layout() {
  const { user, carregando } = useAuth();
  const dentroDaEmpresa = useMatch('/empresas/:empresaId/*');

  if (carregando) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <span className="animate-pulse">
          <LogoMarca tamanho={36} />
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Dentro de uma empresa, a lateral da empresa é a moldura
  if (dentroDaEmpresa) return <Outlet />;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-panel/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Início">
            <Logo tamanho={26} />
          </Link>
          <UserMenu compacto />
        </div>
      </header>
      <main className="w-full flex-1 px-4 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <Outlet />
      </main>
    </div>
  );
}
