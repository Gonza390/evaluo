import 'server-only';

import type { AdminClient } from '@/lib/student-materials/types';
import { renderPdfPagesToPngs } from '@/lib/student-materials/pdf-render';
import { buildStudentMaterialThumbnailPath } from '@/lib/student-materials/thumbnail-path';

const THUMBNAIL_RENDER_SCALE = 0.7;

export async function loadStudentMaterialThumbnail(
  admin: AdminClient,
  filePath: string
): Promise<Buffer | null> {
  const { data, error } = await admin.storage
    .from('biblioteca')
    .download(buildStudentMaterialThumbnailPath(filePath));

  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

export async function generateAndStoreStudentMaterialThumbnail(
  admin: AdminClient,
  filePath: string,
  pdfBuffer: Buffer
): Promise<Buffer | null> {
  const rendered = await renderPdfPagesToPngs(pdfBuffer, {
    pageNumbers: [1],
    batchSize: 1,
    scale: THUMBNAIL_RENDER_SCALE,
  });
  const thumbnail = rendered.images[0];
  if (!thumbnail) return null;

  const { error } = await admin.storage
    .from('biblioteca')
    .upload(buildStudentMaterialThumbnailPath(filePath), thumbnail, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) throw error;
  return thumbnail;
}

export async function ensureStudentMaterialThumbnail(
  admin: AdminClient,
  filePath: string,
  pdfBuffer: Buffer
): Promise<Buffer | null> {
  const cached = await loadStudentMaterialThumbnail(admin, filePath);
  if (cached) return cached;
  return generateAndStoreStudentMaterialThumbnail(admin, filePath, pdfBuffer);
}
