import { Segmento, TipoCampoRelatorio } from '@prisma/client';

interface CampoSugerido {
  rotulo: string;
  tipo: TipoCampoRelatorio;
  obrigatorio?: boolean;
}

interface ServicoSugerido {
  nome: string;
  descricao: string;
  valor: number;
  campos: CampoSugerido[];
}

const { CHECKBOX, TEXTO_CURTO, TEXTO_LONGO } = TipoCampoRelatorio;

const CAMPOS_PASSEIO: CampoSugerido[] = [
  { rotulo: 'Fez xixi', tipo: CHECKBOX },
  { rotulo: 'Fez cocô', tipo: CHECKBOX },
  { rotulo: 'Bebeu água', tipo: CHECKBOX },
  { rotulo: 'Trajeto / local do passeio', tipo: TEXTO_CURTO },
  { rotulo: 'Como o pet se comportou', tipo: TEXTO_LONGO },
];

// Catálogo inicial de cada ramo. O admin pode editar ou desativar tudo depois.
export const SERVICOS_SUGERIDOS: Record<Segmento, ServicoSugerido[]> = {
  PET: [
    {
      nome: 'Passeio de 30 minutos',
      descricao: 'Passeio individual pelo bairro',
      valor: 35,
      campos: CAMPOS_PASSEIO,
    },
    {
      nome: 'Passeio de 1 hora',
      descricao: 'Passeio mais longo, ideal para cães agitados',
      valor: 55,
      campos: CAMPOS_PASSEIO,
    },
    {
      nome: 'Visita pet sitter',
      descricao: 'Visita na casa do tutor para alimentar, brincar e cuidar',
      valor: 60,
      campos: [
        { rotulo: 'Comida e água repostas', tipo: CHECKBOX, obrigatorio: true },
        { rotulo: 'Ambiente limpo', tipo: CHECKBOX },
        { rotulo: 'Brincou com o pet', tipo: CHECKBOX },
        { rotulo: 'Como o pet estava', tipo: TEXTO_LONGO },
      ],
    },
  ],
  CONSTRUCAO: [
    {
      nome: 'Diária de pedreiro',
      descricao: 'Dia de trabalho de alvenaria, reboco ou acabamento',
      valor: 250,
      campos: [
        { rotulo: 'O que foi feito no dia', tipo: TEXTO_LONGO, obrigatorio: true },
        { rotulo: 'Materiais utilizados', tipo: TEXTO_LONGO },
        { rotulo: 'Materiais que estão faltando', tipo: TEXTO_CURTO },
        { rotulo: 'Local limpo ao final', tipo: CHECKBOX },
      ],
    },
    {
      nome: 'Assentamento de piso',
      descricao: 'Valor por m² de piso assentado',
      valor: 60,
      campos: [
        { rotulo: 'Área executada (m²)', tipo: TEXTO_CURTO, obrigatorio: true },
        { rotulo: 'Rejunte aplicado', tipo: CHECKBOX },
        { rotulo: 'Observações da obra', tipo: TEXTO_LONGO },
      ],
    },
    {
      nome: 'Visita técnica / orçamento',
      descricao: 'Avaliação no local para montar o orçamento',
      valor: 100,
      campos: [
        { rotulo: 'Medidas levantadas', tipo: TEXTO_LONGO, obrigatorio: true },
        { rotulo: 'Materiais necessários', tipo: TEXTO_LONGO },
      ],
    },
  ],
  LIMPEZA: [
    {
      nome: 'Faxina completa',
      descricao: 'Limpeza geral da casa ou apartamento',
      valor: 200,
      campos: [
        { rotulo: 'Cozinha', tipo: CHECKBOX },
        { rotulo: 'Banheiros', tipo: CHECKBOX },
        { rotulo: 'Quartos', tipo: CHECKBOX },
        { rotulo: 'Sala', tipo: CHECKBOX },
        { rotulo: 'Produtos que precisam ser repostos', tipo: TEXTO_CURTO },
        { rotulo: 'Observações', tipo: TEXTO_LONGO },
      ],
    },
    {
      nome: 'Limpeza pós-obra',
      descricao: 'Remoção de pó, respingos de tinta e resíduos de obra',
      valor: 400,
      campos: [
        { rotulo: 'Vidros e janelas', tipo: CHECKBOX },
        { rotulo: 'Pisos', tipo: CHECKBOX },
        { rotulo: 'Resíduos retirados', tipo: CHECKBOX },
        { rotulo: 'Observações', tipo: TEXTO_LONGO },
      ],
    },
    {
      nome: 'Passar roupa',
      descricao: 'Valor por cesto de roupas',
      valor: 80,
      campos: [{ rotulo: 'Quantidade de peças', tipo: TEXTO_CURTO }],
    },
  ],
  BELEZA: [
    {
      nome: 'Corte de cabelo',
      descricao: 'Corte com lavagem e finalização',
      valor: 70,
      campos: [
        { rotulo: 'Produtos utilizados', tipo: TEXTO_CURTO },
        { rotulo: 'Preferências do cliente', tipo: TEXTO_LONGO },
      ],
    },
    {
      nome: 'Manicure e pedicure',
      descricao: 'Cutilagem e esmaltação de mãos e pés',
      valor: 60,
      campos: [
        { rotulo: 'Cor do esmalte', tipo: TEXTO_CURTO },
        { rotulo: 'Alguma alergia ou sensibilidade', tipo: TEXTO_CURTO },
      ],
    },
    {
      nome: 'Design de sobrancelha',
      descricao: 'Modelagem com pinça ou cera',
      valor: 45,
      campos: [
        { rotulo: 'Técnica utilizada', tipo: TEXTO_CURTO },
        { rotulo: 'Alguma alergia ou sensibilidade', tipo: TEXTO_CURTO },
      ],
    },
  ],
  MANUTENCAO: [
    {
      nome: 'Reparo elétrico',
      descricao: 'Troca de tomadas, disjuntores, chuveiros e afins',
      valor: 150,
      campos: [
        { rotulo: 'Problema encontrado', tipo: TEXTO_LONGO, obrigatorio: true },
        { rotulo: 'Solução aplicada', tipo: TEXTO_LONGO, obrigatorio: true },
        { rotulo: 'Peças trocadas', tipo: TEXTO_CURTO },
        { rotulo: 'Testado e funcionando', tipo: CHECKBOX },
      ],
    },
    {
      nome: 'Reparo hidráulico',
      descricao: 'Vazamentos, entupimentos e troca de registros',
      valor: 150,
      campos: [
        { rotulo: 'Problema encontrado', tipo: TEXTO_LONGO, obrigatorio: true },
        { rotulo: 'Solução aplicada', tipo: TEXTO_LONGO, obrigatorio: true },
        { rotulo: 'Peças trocadas', tipo: TEXTO_CURTO },
        { rotulo: 'Testado sem vazamentos', tipo: CHECKBOX },
      ],
    },
    {
      nome: 'Limpeza de ar-condicionado',
      descricao: 'Higienização completa de split',
      valor: 180,
      campos: [
        { rotulo: 'Filtros limpos', tipo: CHECKBOX },
        { rotulo: 'Dreno desobstruído', tipo: CHECKBOX },
        { rotulo: 'Observações sobre o aparelho', tipo: TEXTO_LONGO },
      ],
    },
  ],
  AULAS: [
    {
      nome: 'Aula particular (1 hora)',
      descricao: 'Aula individual presencial ou online',
      valor: 90,
      campos: [
        { rotulo: 'Aluno presente', tipo: CHECKBOX },
        { rotulo: 'Conteúdo trabalhado', tipo: TEXTO_LONGO, obrigatorio: true },
        { rotulo: 'Tarefa para a próxima aula', tipo: TEXTO_CURTO },
      ],
    },
    {
      nome: 'Treino personalizado',
      descricao: 'Sessão de treino com acompanhamento',
      valor: 100,
      campos: [
        { rotulo: 'Aluno presente', tipo: CHECKBOX },
        { rotulo: 'Exercícios realizados', tipo: TEXTO_LONGO },
        { rotulo: 'Evolução / observações', tipo: TEXTO_LONGO },
      ],
    },
  ],
  OUTRO: [],
};
