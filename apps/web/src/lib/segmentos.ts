import { PawPrint, type LucideIcon } from 'lucide-react';
import type { PapelVinculo, Segmento } from '../types';

// Uma palavra com singular, plural e gênero, para montar frases como "Nova obra" ou "Nenhum passeio"
export interface Termo {
  singular: string;
  plural: string;
  feminino?: boolean;
}

// Um campo do cadastro de quem recebe o cuidado (raça do pet, endereço do imóvel...)
export interface CampoAssistido {
  chave: string;
  rotulo: string;
  opcoes?: string[]; // com opções vira uma lista de escolha; sem, texto livre
  placeholder?: string;
}

// Cadastro de quem recebe o cuidado. Ramos onde o próprio cliente é atendido não têm.
export interface ConfigAssistido {
  termo: Termo; // Pet, Criança, Imóvel...
  icon: LucideIcon;
  campos: CampoAssistido[];
  exemploInformacao: string; // placeholder do briefing
  exemploLembrete: string;
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
  assistido: ConfigAssistido | null;
}

export const SEGMENTOS: Record<Segmento, ConfigSegmento> = {
  PET: {
    label: 'Pets',
    descricao: 'Passeador de cães, pet sitter, cuidados com animais',
    icon: PawPrint,
    cores: { primary: '#c2410c', hover: '#9a3412', light: '#ffedd5' },
    termos: {
      ordem: { singular: 'Passeio', plural: 'Passeios' },
      executor: { singular: 'Passeador', plural: 'Passeadores' },
      cliente: { singular: 'Cliente', plural: 'Clientes' },
    },
    assistido: {
      termo: { singular: 'Pet', plural: 'Pets' },
      icon: PawPrint,
      campos: [
        { chave: 'especie', rotulo: 'Espécie', opcoes: ['Cachorro', 'Gato', 'Outro'] },
        { chave: 'raca', rotulo: 'Raça', placeholder: 'Ex.: Golden Retriever' },
        { chave: 'porte', rotulo: 'Porte', opcoes: ['Pequeno', 'Médio', 'Grande'] },
        { chave: 'idade', rotulo: 'Idade', placeholder: 'Ex.: 3 anos' },
      ],
      exemploInformacao: 'Ex.: Costuma puxar a guia nos primeiros minutos',
      exemploLembrete: 'Ex.: Dar água após o passeio',
    },
  },
};

// A plataforma atende só o ramo de pets; o parâmetro fica para quando houver outros
export function configSegmento(_segmento?: Segmento | null) {
  return SEGMENTOS.PET;
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
  concluido: (t: Termo) => (t.feminino ? 'concluída' : 'concluído'),
  doDa: (t: Termo) => `${t.feminino ? 'da' : 'do'} ${minusculo(t)}`,
  o: (t: Termo) => `${t.feminino ? 'a' : 'o'} ${minusculo(t)}`,
  cadastrado: (t: Termo) => (t.feminino ? 'cadastrada' : 'cadastrado'),
  meus: (t: Termo) => `${t.feminino ? 'Minhas' : 'Meus'} ${minusculo(t, true)}`,
  um: (t: Termo) => `${t.feminino ? 'uma' : 'um'} ${minusculo(t)}`,
  agendado: (t: Termo) => (t.feminino ? 'agendada' : 'agendado'),
  esse: (t: Termo) => `${t.feminino ? 'essa' : 'esse'} ${minusculo(t)}`,
};

export function nomePapel(segmento: Segmento | undefined | null, papel: PapelVinculo) {
  const { termos } = configSegmento(segmento);
  if (papel === 'ADMIN') return 'Administrador';
  return papel === 'EXECUTOR' ? termos.executor.singular : termos.cliente.singular;
}

// Guarda a cor do ramo (usada na marca da empresa); o roxo do percurso continua sendo a ação principal
export function aplicarTema(segmento: Segmento | null) {
  const root = document.documentElement.style;
  if (!segmento) {
    root.removeProperty('--trade');
    
    return;
  }
  const { cores } = configSegmento(segmento);
  root.setProperty('--trade', cores.primary);
  
}

// Linha "Golden Retriever · Grande · 3 anos" com os campos preenchidos do cadastro
export function resumoDados(dados: Record<string, string> | undefined, config: ConfigAssistido) {
  return config.campos
    .map((c) => dados?.[c.chave])
    .filter(Boolean)
    .join(' · ');
}
