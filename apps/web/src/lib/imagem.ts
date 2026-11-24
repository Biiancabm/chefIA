import { api } from './api';

const LADO_MAXIMO = 256;
const TAMANHO_MAXIMO_ARQUIVO = 5 * 1024 * 1024;

function carregar(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível abrir essa imagem. Tente outro arquivo.'));
    img.src = url;
  });
}

// Reduz a logo no próprio navegador (até 256px no lado maior) e devolve uma data URL leve,
// que a API guarda junto com a empresa. Transparência é mantida.
export async function prepararLogo(arquivo: File): Promise<string> {
  if (!arquivo.type.startsWith('image/')) {
    throw new Error('Escolha um arquivo de imagem (PNG, JPG, SVG ou WebP).');
  }
  if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO) {
    throw new Error('A imagem passa de 5 MB. Escolha uma menor.');
  }

  const url = URL.createObjectURL(arquivo);
  try {
    const img = await carregar(url);
    const vetorial = arquivo.type === 'image/svg+xml';
    const largura = img.naturalWidth || LADO_MAXIMO;
    const altura = img.naturalHeight || LADO_MAXIMO;
    // Imagem pequena não é ampliada (ficaria borrada); SVG pode crescer sem perder nitidez
    const escala = vetorial
      ? LADO_MAXIMO / Math.max(largura, altura)
      : Math.min(1, LADO_MAXIMO / Math.max(largura, altura));

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(largura * escala));
    canvas.height = Math.max(1, Math.round(altura * escala));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Seu navegador não conseguiu processar a imagem.');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // WebP fica bem menor; navegadores sem suporte devolvem PNG
    const webp = canvas.toDataURL('image/webp', 0.92);
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

const LADO_MAXIMO_FOTO = 1600;
const TAMANHO_MAXIMO_FOTO = 15 * 1024 * 1024;

// Reduz uma foto do celular (até 1600px no lado maior) para o envio ficar rápido
async function prepararFoto(arquivo: File): Promise<Blob> {
  if (!arquivo.type.startsWith('image/')) {
    throw new Error('Escolha um arquivo de imagem.');
  }
  if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
    throw new Error('A foto passa de 15 MB. Escolha uma menor.');
  }

  const url = URL.createObjectURL(arquivo);
  try {
    const img = await carregar(url);
    const escala = Math.min(1, LADO_MAXIMO_FOTO / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * escala));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * escala));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Seu navegador não conseguiu processar a imagem.');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) throw new Error('Não foi possível preparar a foto.');
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Envia a foto para a API e devolve o endereço dela (ex.: /uploads/....jpg)
export async function enviarFoto(arquivo: File): Promise<string> {
  const blob = await prepararFoto(arquivo);
  const form = new FormData();
  form.append('arquivo', blob, 'foto.jpg');
  const { data } = await api.post<{ url: string }>('/uploads', form);
  return data.url;
}
