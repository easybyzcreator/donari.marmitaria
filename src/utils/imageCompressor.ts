/**
 * Utilitário leve e seguro para processamento e compressão de imagens em dispositivos móveis e desktop.
 * Evita vazamento de memória e travamento da aba móvel (WebProcess crash) ao usar URL.createObjectURL
 * em vez de carregar arquivos gigantescos inteiros em Base64 na memória RAM.
 */

export type ImageCompressionType = 'product' | 'logo' | 'background' | 'catalog' | 'gallery' | boolean;

interface CompressionConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

const CONFIGS: Record<string, CompressionConfig> = {
  product: { maxWidth: 640, maxHeight: 640, quality: 0.72 },
  logo: { maxWidth: 300, maxHeight: 300, quality: 0.8 },
  background: { maxWidth: 1000, maxHeight: 1000, quality: 0.6 },
  catalog: { maxWidth: 500, maxHeight: 500, quality: 0.65 },
  gallery: { maxWidth: 640, maxHeight: 640, quality: 0.7 },
  default: { maxWidth: 640, maxHeight: 640, quality: 0.7 }
};

export function compressImageFile(
  file: File,
  type: ImageCompressionType = 'product'
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Nenhum arquivo fornecido.'));
      return;
    }

    // Configuração por tipo
    let typeKey = 'product';
    if (typeof type === 'string' && CONFIGS[type]) {
      typeKey = type;
    } else if (type === true) {
      typeKey = 'gallery';
    } else if (type === false) {
      typeKey = 'product';
    }

    const { maxWidth, maxHeight, quality } = CONFIGS[typeKey] || CONFIGS.default;

    // Utiliza URL.createObjectURL para não duplicar o arquivo em memória RAM
    let blobUrl: string | null = null;
    try {
      blobUrl = URL.createObjectURL(file);
    } catch (err) {
      // Fallback caso createObjectURL falhe
      const reader = new FileReader();
      reader.onload = () => {
        processImageSrc(reader.result as string, maxWidth, maxHeight, quality, null, resolve, reject);
      };
      reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
      reader.readAsDataURL(file);
      return;
    }

    processImageSrc(blobUrl, maxWidth, maxHeight, quality, blobUrl, resolve, reject);
  });
}

function processImageSrc(
  src: string,
  maxWidth: number,
  maxHeight: number,
  quality: number,
  blobUrlToRevoke: string | null,
  resolve: (base64: string) => void,
  reject: (err: Error) => void
) {
  const img = new Image();
  // Permite carregar sem bloquear por cross-origin se aplicável
  img.crossOrigin = 'anonymous';

  const cleanup = () => {
    if (blobUrlToRevoke) {
      try {
        URL.revokeObjectURL(blobUrlToRevoke);
      } catch {
        // Ignora erro no revoke
      }
    }
  };

  img.onload = () => {
    try {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (!width || !height) {
        cleanup();
        reject(new Error('Dimensões da imagem inválidas.'));
        return;
      }

      // Redimensionamento proporcional seguro
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { willReadFrequently: false });
      if (!ctx) {
        cleanup();
        reject(new Error('Falha ao obter contexto 2D do Canvas.'));
        return;
      }

      // Fundo branco limpo para imagens com transparência
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Desenha imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Converte para JPEG leve e otimizado
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);

      // Libera memória gráfica do canvas imediatamente
      canvas.width = 0;
      canvas.height = 0;
      cleanup();

      resolve(compressedBase64);
    } catch (err: any) {
      cleanup();
      reject(new Error(err?.message || 'Erro ao comprimir imagem no navegador.'));
    }
  };

  img.onerror = () => {
    cleanup();
    reject(new Error('O navegador não conseguiu decodificar esta imagem. Tente uma foto JPG ou PNG padrão.'));
  };

  img.src = src;
}
