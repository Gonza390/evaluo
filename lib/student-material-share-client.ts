import { buildSeoEntitySlug, slugifySeoSegment } from '@/lib/seo-intents';
import { buildShareCardPath } from '@/lib/share-card';

type StudentMaterialShareImageInput = {
  title: string;
  materiaName?: string | null;
  pageCount?: number | null;
};

type ShareStudentMaterialInput = {
  title: string;
  text: string;
  url: string;
  imagePath?: string | null;
};

export type ShareStudentMaterialResult = 'shared' | 'aborted' | 'unsupported';

const preparedShareImages = new Map<string, File>();
const pendingShareImages = new Map<string, Promise<File | null>>();

export function buildStudentMaterialCanonicalPath(title: string, materialId: string) {
  return `/materiales/${buildSeoEntitySlug(title, materialId)}`;
}

export function buildStudentMaterialShareImagePath({
  title,
  materiaName,
  pageCount,
}: StudentMaterialShareImageInput) {
  return buildShareCardPath({
    kind: 'material',
    title,
    subtitle: materiaName?.trim() || 'Material de estudio compartido',
    detail: pageCount ? `${pageCount} páginas · PDF, resumen y glosario` : 'PDF, resumen y glosario',
  });
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function getShareImageKey(imagePath: string, title: string) {
  if (typeof window === 'undefined') return null;
  return `${new URL(imagePath, window.location.origin).toString()}::${title}`;
}

async function createShareImageFile(imagePath: string, title: string) {
  try {
    const imageUrl = new URL(imagePath, window.location.origin).toString();
    const response = await fetch(imageUrl, { credentials: 'same-origin' });
    if (!response.ok) return null;

    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) return null;

    const extension = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
    const safeTitle = slugifySeoSegment(title).slice(0, 64) || 'material';

    return new File([blob], `evaluo-${safeTitle}.${extension}`, {
      type: blob.type,
      lastModified: Date.now(),
    });
  } catch {
    return null;
  }
}

export function prepareStudentMaterialShareImage(imagePath: string, title: string) {
  const key = getShareImageKey(imagePath, title);
  if (!key) return Promise.resolve<File | null>(null);

  const prepared = preparedShareImages.get(key);
  if (prepared) return Promise.resolve(prepared);

  const pending = pendingShareImages.get(key);
  if (pending) return pending;

  const preparation = createShareImageFile(imagePath, title)
    .then((file) => {
      if (file) preparedShareImages.set(key, file);
      return file;
    })
    .finally(() => {
      pendingShareImages.delete(key);
    });

  pendingShareImages.set(key, preparation);
  return preparation;
}

function getPreparedStudentMaterialShareImage(imagePath: string, title: string) {
  const key = getShareImageKey(imagePath, title);
  return key ? preparedShareImages.get(key) ?? null : null;
}

export async function shareStudentMaterial({
  title,
  text,
  url,
  imagePath,
}: ShareStudentMaterialInput): Promise<ShareStudentMaterialResult> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return 'unsupported';
  }

  const imageFile = imagePath ? getPreparedStudentMaterialShareImage(imagePath, title) : null;

  if (imageFile && typeof navigator.canShare === 'function') {
    const imageShareData: ShareData = {
      title: `${title} | Evaluo`,
      text: `${text}\n${url}`,
      files: [imageFile],
    };

    try {
      if (navigator.canShare({ files: [imageFile] })) {
        await navigator.share(imageShareData);
        return 'shared';
      }
    } catch (error) {
      if (isAbortError(error)) return 'aborted';
      // Algunos share targets aceptan enlaces pero no archivos. Continuamos con el fallback.
    }
  }

  try {
    await navigator.share({
      title: `${title} | Evaluo`,
      text,
      url,
    });
    return 'shared';
  } catch (error) {
    if (isAbortError(error)) return 'aborted';
    return 'unsupported';
  }
}
