import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from './api';
import type { OrdemServico, PapelVinculo, Servico } from '../types';

const UM_MINUTO = 60_000;

// O que está esperando uma resposta desta pessoa, para mostrar um número no menu.
// Enquanto não há notificações, a lista se atualiza sozinha a cada minuto com o app aberto.
// - Passeador: pedidos de passeio dos clientes para aceitar ou recusar
// - Cliente: passeios que o passeador agendou e falta aceitar
// - Admin: serviços novos e preços pedidos pelos passeadores para aprovar
export function usePendencias(empresaId: string | undefined, papel: PapelVinculo | undefined) {
  const { data: ordens } = useQuery({
    queryKey: ['ordens-servico', empresaId],
    queryFn: async () => (await api.get<OrdemServico[]>(`/empresas/${empresaId}/ordens-servico`)).data,
    enabled: !!empresaId && (papel === 'EXECUTOR' || papel === 'CLIENTE'),
    refetchInterval: UM_MINUTO,
  });

  // Chave começando por ['servicos', empresaId]: quando a tela de Serviços atualiza, o número atualiza junto
  const { data: servicos } = useQuery({
    queryKey: ['servicos', empresaId, 'pendencias'],
    queryFn: async () =>
      (await api.get<Servico[]>(`/empresas/${empresaId}/servicos`, { params: { incluirInativos: 'true' } })).data,
    enabled: !!empresaId && papel === 'ADMIN',
    refetchInterval: UM_MINUTO,
  });

  const passeios =
    papel === 'EXECUTOR'
      ? (ordens ?? []).filter((o) => o.status === 'PENDENTE_EXECUTOR').length
      : papel === 'CLIENTE'
        ? (ordens ?? []).filter((o) => o.status === 'PENDENTE_CLIENTE').length
        : 0;

  const aprovacoes =
    papel === 'ADMIN'
      ? (servicos ?? []).reduce(
          (total, s) => total + (s.aprovado ? 0 : 1) + s.executores.filter((e) => e.valorProposto !== null).length,
          0,
        )
      : 0;

  // Número também no título da aba/janela: "(2) easyService"
  const total = passeios + aprovacoes;
  useEffect(() => {
    document.title = total ? `(${total}) easyService` : 'easyService';
    return () => {
      document.title = 'easyService';
    };
  }, [total]);

  return { 'ordens-servico': passeios, servicos: aprovacoes } as Record<string, number>;
}
