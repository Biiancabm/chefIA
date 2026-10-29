import {
  Briefcase,
  GraduationCap,
  HardHat,
  PawPrint,
  Scissors,
  Sparkles,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { PapelVinculo, Segmento } from '../types';

// Uma palavra com singular, plural e gênero, para montar frases como "Nova obra" ou "Nenhum passeio"
export interface Termo {
  singular: string;
  plural: string;
  feminino?: boolean;
}

export interface ConfigSegmento {
  label: string;
  descricao: string;
  icon: LucideIcon;
  cores: { primary: string; hover: string; light: string };
  termos: {
    ordem: Termo; // o que é agendado (passeio, obra, chamado...)
    executor: Termo; // quem presta o serviço
    cliente: Termo; // quem contrata
  };
}

export const SEGMENTOS: Record<Segmento, ConfigSegmento> = {
  PET: {
    label: 'Pets',
    descricao: 'Passeador de cães, pet sitter, cuidados com animais',
    icon: PawPrint,
    cores: { primary: '#ea580c', hover: '#c2410c', light: '#ffedd5' },
    termos: {
      ordem: { singular: 'Passeio', plural: 'Passeios' },
      executor: { singular: 'Passeador', plural: 'Passeadores' },
      cliente: { singular: 'Tutor', plural: 'Tutores' },
    },
  },
  CONSTRUCAO: {
    label: 'Construção e reformas',
    descricao: 'Pedreiro, pintor, gesseiro, obras em geral',
    icon: HardHat,
    cores: { primary: '#a16207', hover: '#854d0e', light: '#fef3c7' },
    termos: {
      ordem: { singular: 'Obra', plural: 'Obras', feminino: true },
      executor: { singular: 'Profissional', plural: 'Profissionais' },
      cliente: { singular: 'Cliente', plural: 'Clientes' },
    },
  },
  LIMPEZA: {
    label: 'Limpeza',
    descricao: 'Diarista, faxina, limpeza pós-obra',
    icon: Sparkles,
    cores: { primary: '#0891b2', hover: '#0e7490', light: '#cffafe' },
    termos: {
      ordem: { singular: 'Limpeza', plural: 'Limpezas', feminino: true },
      executor: { singular: 'Diarista', plural: 'Diaristas' },
      cliente: { singular: 'Cliente', plural: 'Clientes' },
    },
  },
  BELEZA: {
    label: 'Beleza e estética',
    descricao: 'Cabeleireiro, manicure, estética',
    icon: Scissors,
    cores: { primary: '#db2777', hover: '#be185d', light: '#fce7f3' },
    termos: {
      ordem: { singular: 'Atendimento', plural: 'Atendimentos' },
      executor: { singular: 'Profissional', plural: 'Profissionais' },
      cliente: { singular: 'Cliente', plural: 'Clientes' },
    },
  },
  MANUTENCAO: {
    label: 'Manutenção e reparos',
    descricao: 'Eletricista, encanador, ar-condicionado',
    icon: Wrench,
    cores: { primary: '#4f46e5', hover: '#4338ca', light: '#e0e7ff' },
    termos: {
      ordem: { singular: 'Chamado', plural: 'Chamados' },
      executor: { singular: 'Técnico', plural: 'Técnicos' },
      cliente: { singular: 'Cliente', plural: 'Clientes' },
    },
  },
  AULAS: {
    label: 'Aulas e treinos',
    descricao: 'Professor particular, personal trainer',
    icon: GraduationCap,
    cores: { primary: '#7c3aed', hover: '#6d28d9', light: '#ede9fe' },
    termos: {
      ordem: { singular: 'Aula', plural: 'Aulas', feminino: true },
      executor: { singular: 'Professor', plural: 'Professores' },
      cliente: { singular: 'Aluno', plural: 'Alunos' },
    },
  },
  OUTRO: {
    label: 'Outro ramo',
    descricao: 'Qualquer outro tipo de prestação de serviço',
    icon: Briefcase,
    cores: { primary: '#2563eb', hover: '#1d4ed8', light: '#dbeafe' },
    termos: {
      ordem: { singular: 'Ordem de serviço', plural: 'Ordens de serviço', feminino: true },
      executor: { singular: 'Executor', plural: 'Executores' },
      cliente: { singular: 'Cliente', plural: 'Clientes' },
    },
  },
};

export const LISTA_SEGMENTOS = Object.keys(SEGMENTOS) as Segmento[];

export function configSegmento(segmento: Segmento | undefined | null) {
  return SEGMENTOS[segmento ?? 'OUTRO'] ?? SEGMENTOS.OUTRO;
}

const minusculo = (t: Termo, plural = false) => {
  const palavra = plural ? t.plural : t.singular;
  return palavra.charAt(0).toLowerCase() + palavra.slice(1);
};

// Helpers de texto: novo(obra) -> "Nova obra", nenhum(passeio) -> "Nenhum passeio"
export const texto = {
  min: minusculo,
  novo: (t: Termo) => `${t.feminino ? 'Nova' : 'Novo'} ${minusculo(t)}`,
  nenhum: (t: Termo) => `${t.feminino ? 'Nenhuma' : 'Nenhum'} ${minusculo(t)}`,
  proximo: (t: Termo) => `${t.feminino ? 'Próxima' : 'Próximo'} ${minusculo(t)}`,
  proximos: (t: Termo) => `${t.feminino ? 'Próximas' : 'Próximos'} ${minusculo(t, true)}`,
  seus: (t: Termo) => `${t.feminino ? 'Suas' : 'Seus'} ${minusculo(t, true)}`,
  todos: (t: Termo) => `${t.feminino ? 'Todas as' : 'Todos os'} ${minusculo(t, true)}`,
  os: (t: Termo) => `${t.feminino ? 'as' : 'os'} ${minusculo(t, true)}`,
  concluidos: (t: Termo) => (t.feminino ? 'concluídas' : 'concluídos'),
  doDa: (t: Termo) => `${t.feminino ? 'da' : 'do'} ${minusculo(t)}`,
  um: (t: Termo) => `${t.feminino ? 'uma' : 'um'} ${minusculo(t)}`,
  agendado: (t: Termo) => (t.feminino ? 'agendada' : 'agendado'),
  esse: (t: Termo) => `${t.feminino ? 'essa' : 'esse'} ${minusculo(t)}`,
};

export function nomePapel(segmento: Segmento | undefined | null, papel: PapelVinculo) {
  const { termos } = configSegmento(segmento);
  if (papel === 'ADMIN') return 'Administrador';
  return papel === 'EXECUTOR' ? termos.executor.singular : termos.cliente.singular;
}

// Troca a cor principal do site inteiro para a cor do ramo
export function aplicarTema(segmento: Segmento | null) {
  const root = document.documentElement.style;
  if (!segmento) {
    root.removeProperty('--color-primary');
    root.removeProperty('--color-primary-hover');
    root.removeProperty('--color-primary-light');
    return;
  }
  const { cores } = configSegmento(segmento);
  root.setProperty('--color-primary', cores.primary);
  root.setProperty('--color-primary-hover', cores.hover);
  root.setProperty('--color-primary-light', cores.light);
}
