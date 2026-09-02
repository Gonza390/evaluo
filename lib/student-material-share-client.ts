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

export async function shareStudentMaterial({
  title,
  text,
  url,
  imagePath,
}: ShareStudentMaterialInput): Promise<ShareStudentMaterialResult> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return 'unsupported';
  }

  if (imagePath && typeof navigator.canShare === 'function') {
    const imageFile = await createShareImageFile(imagePath, title);

    if (imageFile) {
      const imageShareData: ShareData = {
        title: `${title} | Evaluo`,
        text: `${text}\n${url}`,
        url,
        files: [imageFile],
      };

      try {
        if (navigator.canShare(imageShareData)) {
          await navigator.share(imageShareData);
          return 'shared';
        }
      } catch (error) {
        if (isAbortError(error)) return 'aborted';
        // Algunos share targets aceptan enlaces pero no archivos. Continuamos con el fallback.
      }
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
