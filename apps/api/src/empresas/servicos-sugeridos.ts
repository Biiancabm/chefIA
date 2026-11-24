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

// Catálogo inicial da empresa de pets. O admin pode editar ou desativar tudo depois.
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
      descricao: 'Visita na casa do cliente para alimentar, brincar e cuidar',
      valor: 60,
      campos: [
        { rotulo: 'Comida e água repostas', tipo: CHECKBOX, obrigatorio: true },
        { rotulo: 'Ambiente limpo', tipo: CHECKBOX },
        { rotulo: 'Brincou com o pet', tipo: CHECKBOX },
        { rotulo: 'Como o pet estava', tipo: TEXTO_LONGO },
      ],
    },
  ],
};
