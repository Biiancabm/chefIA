import { isAxiosError } from 'axios';

// Mensagem clara para erros que não são culpa da pessoa (servidor fora do ar, muitas tentativas).
// Devolve null quando o erro é outro, para a tela usar a mensagem dela.
export function erroDeConexao(erro: unknown): string | null {
  if (!isAxiosError(erro)) return null;
  if (!erro.response || erro.response.status >= 502) {
    return 'Não foi possível falar com o servidor. Confira sua internet e tente de novo em instantes.';
  }
  if (erro.response.status === 429) {
    return 'Muitas tentativas seguidas. Espere um minuto e tente de novo.';
  }
  return null;
}

// Mensagem que a API devolveu (ex.: "Esse email já está cadastrado"), ou o texto padrão
export function mensagemDaApi(erro: unknown, padrao: string): string {
  const conexao = erroDeConexao(erro);
  if (conexao) return conexao;
  const msg = isAxiosError(erro) ? erro.response?.data?.message : null;
  if (Array.isArray(msg)) return msg[0];
  if (typeof msg === 'string') return msg;
  return padrao;
}
