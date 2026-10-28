/**
 * Telefondan tanlangan rasmni yuklashdan oldin kichraytiradi:
 * eng uzun tomoni maxSize px, JPEG. 5 MB lik surat ~150 KB bo'lib ketadi.
 */
export async function shrinkImage(file: File, maxSize = 1200, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error('Rasmni o‘qib bo‘lmadi. JPG yoki PNG tanlang.');

  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Rasmni tayyorlab bo‘lmadi');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Rasmni tayyorlab bo‘lmadi'))), 'image/jpeg', quality),
  );
}
