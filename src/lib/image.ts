/**
 * Fotoğraf yükleme yardımcıları.
 * LocalStorage kotasını korumak için görseller tarayıcıda küçültülür ve JPEG'e çevrilir.
 */

const MAX_FILE_MB = 12;

export async function optimizeImageFile(
  file: File,
  maxSize = 720,
  quality = 0.82,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Lütfen bir görsel dosyası seçin (JPG, PNG, WebP).");
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`Dosya çok büyük (en fazla ${MAX_FILE_MB} MB).`);
  }

  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);

  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Görsel işlenemedi. Tarayıcınızı güncelleyin.");

  // Şeffaf PNG'lerde siyah zemin oluşmaması için beyaz dolgu
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", quality);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Dosya okunamadı."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Görsel açılamadı. Farklı bir dosya deneyin."));
    image.src = src;
  });
}
