import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'universal:accessToken';

// "Lembrar de mim" marcado: token fica salvo (localStorage).
// Desmarcado: vale só até fechar a aba (sessionStorage).
export function lerToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) ?? sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

export function salvarToken(token: string, lembrar = true) {
  limparToken();
  (lembrar ? localStorage : sessionStorage).setItem(TOKEN_STORAGE_KEY, token);
}

export function limparToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

export const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = lerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      limparToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
