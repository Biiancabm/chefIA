// Copia um texto para a área de transferência.
// navigator.clipboard só existe em páginas seguras (https ou localhost); abrindo o site pelo
// IP da rede (ex.: http://192.168.0.10:5173, no celular) ele não existe e o botão não fazia nada.
// Nesse caso, usa o jeito antigo: um campo de texto escondido + "copiar".
export async function copiarTexto(texto: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      // segue para o jeito antigo
    }
  }

  const campo = document.createElement('textarea');
  campo.value = texto;
  campo.setAttribute('readonly', '');
  campo.style.position = 'fixed';
  campo.style.top = '0';
  campo.style.opacity = '0';
  // Dentro de um modal, o campo precisa ficar no modal para poder receber o foco
  const destino = (document.activeElement?.closest('[role="dialog"]') as HTMLElement | null) ?? document.body;
  destino.appendChild(campo);
  campo.focus();
  campo.select();
  campo.setSelectionRange(0, texto.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  destino.removeChild(campo);
  return ok;
}
