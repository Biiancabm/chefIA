export type Segmento = 'PET';
export type ModeloRemuneracao = 'COMISSAO' | 'SALARIO';
export type PapelVinculo = 'ADMIN' | 'EXECUTOR' | 'CLIENTE';
export type StatusVinculo = 'PENDENTE' | 'ATIVO' | 'INATIVO';
export type StatusOS =
  | 'PENDENTE_EXECUTOR' // cliente pediu, falta o passeador aceitar
  | 'PENDENTE_CLIENTE' // passeador agendou, falta o cliente aceitar
  | 'AGENDADO'
  | 'EXECUTANDO'
  | 'FINALIZADO'
  | 'CANCELADO'
  | 'RECUSADO'
  | 'RECEBIDO';
export type FormaPagamento = 'PIX' | 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'TRANSFERENCIA' | 'OUTRO';

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
  segmento: Segmento;
  modeloRemuneracao: ModeloRemuneracao;
  logoUrl: string | null;
  criadoPorId: string;
  criadoEm: string;
}

export interface MinhaEmpresa {
  vinculoId: string;
  papel: PapelVinculo;
  empresa: Empresa;
  // Cliente: o passeador que o atende
  responsavel: { vinculoId: string; nome: string } | null;
  // Passeador: quanto ele recebe
  remuneracao: { comissaoPercentual: string | null; salarioMensal: string | null } | null;
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
  vinculoResponsavelId: string | null;
  servicoIds: string[];
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
  aprovado: boolean; // serviço criado por um passeador fica false até o admin aprovar
  criadoPor: { vinculoId: string; nome: string } | null;
  criadoEm: string;
  executores: ExecutorDoServico[];
  camposRelatorio: CampoRelatorio[];
}

export interface ExecutorDoServico {
  vinculoExecutorId: string;
  nome: string;
  email: string;
  valor: string | null; // preço próprio aprovado (vazio = preço do catálogo)
  valorProposto: string | null; // preço pedido, aguardando o admin
  propostoEm: string | null;
}

export interface Membro {
  id: string;
  userId: string;
  empresaId: string;
  papel: PapelVinculo;
  status: StatusVinculo;
  criadoEm: string;
  user: Usuario;
  vinculoResponsavelId: string | null;
  comissaoPercentual: string | null;
  salarioMensal: string | null;
  responsavel: (Vinculo & { user: Usuario }) | null;
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
  pagoEm: string | null;
  formaPagamento: FormaPagamento | null;
  criadoPorId: string;
  criadoEm: string;
  atualizadoEm: string;
  assistido: Assistido | null;
  vinculoCliente: Vinculo & { user: Usuario };
  itens: OrdemServicoItem[];
}

// Quem recebe o cuidado: o pet, a criança, o imóvel... (o nome muda por ramo)
export interface Assistido {
  id: string;
  empresaId: string;
  vinculoClienteId: string;
  nome: string;
  fotoUrl: string | null;
  dados: Record<string, string>;
  informacoes: string[];
  lembretes: string[];
  ativo: boolean;
  criadoEm: string;
  vinculoCliente?: Vinculo & { user: Usuario };
}
