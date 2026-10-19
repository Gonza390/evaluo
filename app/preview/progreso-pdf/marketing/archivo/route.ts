import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function GET() {
  // Ruta fija exclusivamente de desarrollo. No admite rutas de archivos como entrada.
  if (process.env.NODE_ENV !== 'development') return new Response(null, { status: 404 });
  const pdf = await readFile(path.join(process.cwd(), 'tmp/marketing-preview/material.pdf')).catch(
    () => null
  );
  if (!pdf) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="marketing-i.pdf"',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
