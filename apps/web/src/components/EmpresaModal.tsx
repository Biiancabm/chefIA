import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { Empresa, ModeloRemuneracao } from '../types';
import { LogoCampo } from './EmpresaMarca';
import { RemuneracaoPicker } from './RemuneracaoPicker';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';

function mensagemDeErro(erro: unknown) {
  if (isAxiosError(erro)) {
    if (erro.response?.status === 413) return 'A imagem da logo é grande demais. Escolha outra.';
    const msg = erro.response?.data?.message;
    if (Array.isArray(msg)) return msg[0];
    if (typeof msg === 'string') return msg;
  }
  return 'Não foi possível salvar. Tente de novo.';
}

// Logo, nome e pagamento dos passeadores (só o administrador abre)
export function EmpresaModal({ open, onClose, empresa }: { open: boolean; onClose: () => void; empresa: Empresa }) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState(empresa.nome);
  const [logoUrl, setLogoUrl] = useState<string | null>(empresa.logoUrl);
  const [modelo, setModelo] = useState<ModeloRemuneracao>(empresa.modeloRemuneracao);
  const [criarSugeridos, setCriarSugeridos] = useState(false);

  const salvar = useMutation({
    mutationFn: async () => {
      await api.patch(`/empresas/${empresa.id}`, { nome: nome.trim(), logoUrl, modeloRemuneracao: modelo });
      if (criarSugeridos) {
        await api.post(`/empresas/${empresa.id}/servicos-sugeridos`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minhas-empresas'] });
      queryClient.invalidateQueries({ queryKey: ['servicos', empresa.id] });
      onClose();
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    salvar.mutate();
  }

  return (
    <Modal open={open} onClose={onClose} title="Dados da empresa" description="Logo, nome e pagamento dos passeadores." largo>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-start">
          <LogoCampo valor={logoUrl} onChange={setLogoUrl} segmento={empresa.segmento} />
          <Input
            label="Nome da empresa"
            name="nomeEmpresa"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-5">
          <p className="rotulo mb-0!">Como os passeadores são pagos</p>
          <RemuneracaoPicker value={modelo} onChange={setModelo} />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3.5 text-sm text-text">
          <input
            type="checkbox"
            checked={criarSugeridos}
            onChange={(e) => setCriarSugeridos(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded"
          />
          <span>
            Adicionar os serviços sugeridos de pets
            <span className="mt-0.5 block text-[13px] text-text-muted">
              Passeios e visita pet sitter, com checklist de relatório pronto. Serviços com o mesmo nome não são
              duplicados.
            </span>
          </span>
        </label>

        {salvar.isError && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">
            {mensagemDeErro(salvar.error)}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={salvar.isPending} disabled={!nome.trim()}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
