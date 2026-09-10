export type PapelVinculo = 'ADMIN' | 'EXECUTOR' | 'CLIENTE';
export type StatusVinculo = 'PENDENTE' | 'ATIVO' | 'INATIVO';
export type StatusOS =
  | 'AGENDADO'
  | 'EXECUTANDO'
  | 'FINALIZADO'
  | 'CANCELADO'
  | 'RECEBIDO';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
}

export interface Empresa {
  id: string;
  nome: string;
  documento: string | null;
  telefone: string | null;
  criadoPorId: string;
  criadoEm: string;
}

export interface MinhaEmpresa {
  vinculoId: string;
  papel: PapelVinculo;
  empresa: Empresa;
}

export interface Vinculo {
  id: string;
  userId: string;
  empresaId: string;
  papel: PapelVinculo;
  status: StatusVinculo;
  criadoEm: string;
}

export interface Convite {
  id: string;
  empresaId: string;
  papel: PapelVinculo;
  token: string;
  emailConvidado: string | null;
  criadoPorId: string;
  expiraEm: string;
  usadoEm: string | null;
  criadoEm: string;
}

export type TipoCampoRelatorio = 'CHECKBOX' | 'TEXTO_CURTO' | 'TEXTO_LONGO';

export interface CampoRelatorio {
  id: string;
  servicoId: string;
  rotulo: string;
  tipo: TipoCampoRelatorio;
  obrigatorio: boolean;
  ordem: number;
}

export interface Servico {
  id: string;
  empresaId: string;
  nome: string;
  descricao: string | null;
  valor: string;
  fotos: string[];
  ativo: boolean;
  criadoEm: string;
  executores: ExecutorDoServico[];
  camposRelatorio: CampoRelatorio[];
}

export interface ExecutorDoServico {
  vinculoExecutorId: string;
  nome: string;
  email: string;
}

export interface Membro {
  id: string;
  userId: string;
  empresaId: string;
  papel: PapelVinculo;
  status: StatusVinculo;
  criadoEm: string;
  user: Usuario;
}

export interface RelatorioValor {
  id: string;
  relatorioId: string;
  campoId: string;
  valor: string;
}

export interface Relatorio {
  id: string;
  ordemServicoItemId: string;
  horaInicio: string;
  horaFim: string;
  observacoes: string | null;
  fotos: string[];
  criadoEm: string;
  valores: RelatorioValor[];
}

export interface OrdemServicoItem {
  id: string;
  servicoId: string;
  vinculoExecutorId: string;
  valor: string;
  servico: Servico;
  vinculoExecutor: Vinculo & { user: Usuario };
  relatorio: Relatorio | null;
}

export interface OrdemServico {
  id: string;
  empresaId: string;
  vinculoClienteId: string;
  status: StatusOS;
  dataAgendada: string;
  observacoes: string | null;
  valorTotal: string;
  criadoPorId: string;
  criadoEm: string;
  atualizadoEm: string;
  vinculoCliente: Vinculo & { user: Usuario };
  itens: OrdemServicoItem[];
}
