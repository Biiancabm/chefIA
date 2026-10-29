import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import { configSegmento } from '../lib/segmentos';
import type { Segmento } from '../types';
import { SegmentoPicker } from './SegmentoPicker';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

export function SegmentoModal({
  open,
  onClose,
  empresaId,
  segmentoAtual,
}: {
  open: boolean;
  onClose: () => void;
  empresaId: string;
  segmentoAtual: Segmento;
}) {
  const queryClient = useQueryClient();
  const [segmento, setSegmento] = useState<Segmento>(segmentoAtual);
  const [criarSugeridos, setCriarSugeridos] = useState(false);

  const salvar = useMutation({
    mutationFn: async () => {
      await api.patch(`/empresas/${empresaId}`, { segmento });
      if (criarSugeridos) {
        await api.post(`/empresas/${empresaId}/servicos-sugeridos`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhas-empresas'] });
      queryClient.invalidateQueries({ queryKey: ['servicos', empresaId] });
      onClose();
    },
  });

  const temSugestoes = segmento !== 'OUTRO';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ramo de atividade"
      description="O site se adapta ao ramo: nomes, cores e serviços sugeridos."
      largo
    >
      <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
        <SegmentoPicker value={segmento} onChange={setSegmento} />
        {temSugestoes && (
          <label className="flex items-start gap-2.5 rounded-xl bg-surface p-3 text-sm text-text">
            <input
              type="checkbox"
              checked={criarSugeridos}
              onChange={(e) => setCriarSugeridos(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
            />
            <span>
              Adicionar os serviços sugeridos de{' '}
              <strong>{configSegmento(segmento).label.toLowerCase()}</strong>
              <span className="block text-xs text-text-muted">
                Com checklist de relatório pronto. Serviços com o mesmo nome não são duplicados.
              </span>
            </span>
          </label>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={() => salvar.mutate()} loading={salvar.isPending}>
          Salvar
        </Button>
      </div>
    </Modal>
  );
}
