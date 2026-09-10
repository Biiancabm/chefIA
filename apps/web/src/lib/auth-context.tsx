import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api, TOKEN_STORAGE_KEY } from './api';
import type { Usuario } from '../types';

interface RegisterInput {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
}

interface LoginInput {
  email: string;
  senha: string;
}

interface AuthContextValue {
  user: Usuario | null;
  carregando: boolean;
  login: (input: LoginInput) => Promise<void>;
  registrar: (input: RegisterInput) => Promise<void>;
  sair: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setCarregando(false);
      return;
    }
    api
      .get<Usuario>('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem(TOKEN_STORAGE_KEY))
      .finally(() => setCarregando(false));
  }, []);

  async function login(input: LoginInput) {
    const res = await api.post('/auth/login', input);
    localStorage.setItem(TOKEN_STORAGE_KEY, res.data.accessToken);
    setUser(res.data.user);
  }

  async function registrar(input: RegisterInput) {
    const res = await api.post('/auth/registro', input);
    localStorage.setItem(TOKEN_STORAGE_KEY, res.data.accessToken);
    setUser(res.data.user);
  }

  function sair() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, carregando, login, registrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return ctx;
}
