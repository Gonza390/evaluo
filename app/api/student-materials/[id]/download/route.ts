import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { enforceRateLimit, getRequestClientKey, rateLimitHeaders } from '@/lib/rate-limit';
import { buildSeoEntitySlug } from '@/lib/seo-intents';
import { isUuid } from '@/lib/uuid';

export const runtime = 'nodejs';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const BRAND_BLUE = rgb(37 / 255, 99 / 255, 235 / 255);
const BRAND_INDIGO = rgb(79 / 255, 70 / 255, 229 / 255);
const SLATE_950 = rgb(15 / 255, 23 / 255, 42 / 255);
const SLATE_600 = rgb(71 / 255, 85 / 255, 105 / 255);
const SLATE_400 = rgb(148 / 255, 163 / 255, 184 / 255);
const PALE_BLUE = rgb(239 / 255, 246 / 255, 255 / 255);
const WHITE = rgb(1, 1, 1);

function toPdfText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKC')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number) {
  const words = toPdfText(text).split(' ').filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines;
}

function drawWrappedText({
  page,
  text,
  font,
  fontSize,
  x,
  y,
  maxWidth,
  lineHeight,
  color,
  maxLines,
}: {
  page: PDFPage;
  text: string;
  font: PDFFont;
  fontSize: number;
  x: number;
  y: number;
  maxWidth: number;
  lineHeight: number;
  color: ReturnType<typeof rgb>;
  maxLines?: number;
}) {
  const lines = wrapText(text, font, fontSize, maxWidth);
  const visibleLines = typeof maxLines === 'number' ? lines.slice(0, maxLines) : lines;

  visibleLines.forEach((line, index) => {
    let value = line;
    if (typeof maxLines === 'number' && index === maxLines - 1 && lines.length > maxLines) {
      while (value.length > 1 && font.widthOfTextAtSize(`${value}...`, fontSize) > maxWidth) {
        value = value.slice(0, -1).trimEnd();
      }
      value = `${value}...`;
    }

    page.drawText(value, {
      x,
      y: y - index * lineHeight,
      size: fontSize,
      font,
      color,
    });
  });

  return y - visibleLines.length * lineHeight;
}

function sanitizeDownloadName(title: string) {
  const normalized = toPdfText(title)
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
  return `${normalized || 'material-de-estudio'} - Evaluo.pdf`;
}

function asciiFilename(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/["\\]/g, '-')
    .slice(0, 150);
}

async function addEvaluoCover({
  originalBytes,
  title,
  materiaName,
  carreraName,
  universidadName,
  pageCount,
  materialUrl,
}: {
  originalBytes: ArrayBuffer;
  title: string;
  materiaName: string;
  carreraName: string;
  universidadName: string;
  pageCount: number | null;
  materialUrl: string;
}) {
  const pdf = await PDFDocument.load(originalBytes);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const cover = pdf.insertPage(0, [A4_WIDTH, A4_HEIGHT]);

  cover.drawRectangle({ x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT, color: WHITE });
  cover.drawRectangle({ x: 0, y: A4_HEIGHT - 14, width: A4_WIDTH, height: 14, color: BRAND_BLUE });

  cover.drawText('Evaluo', {
    x: 48,
    y: 758,
    size: 31,
    font: bold,
    color: BRAND_BLUE,
  });
  cover.drawText('Tu espacio academico', {
    x: 49,
    y: 737,
    size: 10.5,
    font: regular,
    color: SLATE_600,
  });

  cover.drawRectangle({
    x: 48,
    y: 692,
    width: 205,
    height: 30,
    color: PALE_BLUE,
    borderColor: rgb(191 / 255, 219 / 255, 254 / 255),
    borderWidth: 1,
  });
  cover.drawText('MATERIAL COMPARTIDO PARA ESTUDIAR', {
    x: 61,
    y: 702,
    size: 9,
    font: bold,
    color: BRAND_BLUE,
  });

  let cursorY = drawWrappedText({
    page: cover,
    text: title,
    font: bold,
    fontSize: 24,
    x: 48,
    y: 654,
    maxWidth: A4_WIDTH - 96,
    lineHeight: 29,
    color: SLATE_950,
    maxLines: 3,
  });

  cursorY -= 10;
  const contextRows = [
    ['Materia', materiaName],
    ['Carrera', carreraName],
    ['Universidad', universidadName],
  ] as const;

  for (const [label, value] of contextRows) {
    cover.drawText(label.toUpperCase(), {
      x: 48,
      y: cursorY,
      size: 8.5,
      font: bold,
      color: SLATE_400,
    });
    cursorY = drawWrappedText({
      page: cover,
      text: value,
      font: regular,
      fontSize: 11.5,
      x: 118,
      y: cursorY - 1,
      maxWidth: A4_WIDTH - 166,
      lineHeight: 15,
      color: SLATE_600,
      maxLines: 2,
    });
    cursorY -= 10;
  }

  if (pageCount) {
    cover.drawText(`Documento original: ${pageCount} paginas`, {
      x: 48,
      y: cursorY,
      size: 10.5,
      font: regular,
      color: SLATE_600,
    });
  }

  const toolsY = Math.min(cursorY - 58, 390);
  cover.drawText('Segui estudiando este material en Evaluo', {
    x: 48,
    y: toolsY + 88,
    size: 15.5,
    font: bold,
    color: SLATE_950,
  });
  cover.drawText('El PDF compartido tambien puede incluir herramientas para estudiar mejor:', {
    x: 48,
    y: toolsY + 64,
    size: 10.5,
    font: regular,
    color: SLATE_600,
  });

  const toolLabels = ['Resumen', 'Glosario', 'Flashcards', 'Ejercicios'];
  toolLabels.forEach((label, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 48 + column * 244;
    const y = toolsY + 18 - row * 46;
    cover.drawRectangle({
      x,
      y,
      width: 226,
      height: 34,
      color: rgb(248 / 255, 250 / 255, 252 / 255),
      borderColor: rgb(226 / 255, 232 / 255, 240 / 255),
      borderWidth: 1,
    });
    cover.drawRectangle({ x: x + 12, y: y + 11, width: 10, height: 10, color: BRAND_INDIGO });
    cover.drawText(label, {
      x: x + 32,
      y: y + 11,
      size: 10.5,
      font: bold,
      color: SLATE_600,
    });
  });

  cover.drawRectangle({
    x: 48,
    y: 132,
    width: A4_WIDTH - 96,
    height: 88,
    color: BRAND_BLUE,
  });
  cover.drawText('Abrir este material en Evaluo', {
    x: 68,
    y: 186,
    size: 14,
    font: bold,
    color: WHITE,
  });
  drawWrappedText({
    page: cover,
    text: materialUrl,
    font: regular,
    fontSize: 9.5,
    x: 68,
    y: 165,
    maxWidth: A4_WIDTH - 136,
    lineHeight: 13,
    color: WHITE,
    maxLines: 2,
  });

  cover.drawText('El contenido academico pertenece a su autor o aportante original.', {
    x: 48,
    y: 82,
    size: 8.5,
    font: regular,
    color: SLATE_400,
  });
  cover.drawText('Evaluo agrega esta portada unicamente a la copia descargada; el PDF original no se modifica.', {
    x: 48,
    y: 68,
    size: 8.5,
    font: regular,
    color: SLATE_400,
  });
  cover.drawText('evaluo.com.ar', {
    x: 48,
    y: 42,
    size: 10,
    font: bold,
    color: BRAND_BLUE,
  });

  return pdf.save();
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const clientKey = getRequestClientKey(request);
    const rateLimit = await enforceRateLimit({
      key: `student-material-download:${clientKey}`,
      limit: 10,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return Response.json(
        { error: 'rate_limited' },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const { id } = await context.params;
    if (!isUuid(id)) {
      return Response.json({ error: 'invalid_material' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: material, error: materialError } = await admin
      .from('student_materials')
      .select(
        'id, user_id, universidad_id, carrera_id, materia_id, title, file_path, page_count, visibility, processing_status'
      )
      .eq('id', id)
      .maybeSingle();

    if (materialError || !material) {
      return Response.json({ error: 'material_not_found' }, { status: 404 });
    }

    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isOwner = user?.id === material.user_id;
    const isShared = material.visibility === 'shared';
    if (!isShared && !isOwner) {
      return Response.json({ error: 'material_not_found' }, { status: 404 });
    }

    if (material.processing_status !== 'ready') {
      return Response.json({ error: 'material_not_ready' }, { status: 409 });
    }

    const [{ data: materia }, { data: carrera }, { data: universidad }, downloadResult] =
      await Promise.all([
        admin.from('materias').select('nombre').eq('id', material.materia_id).maybeSingle(),
        admin.from('carreras').select('nombre').eq('id', material.carrera_id).maybeSingle(),
        admin.from('universidades').select('nombre').eq('id', material.universidad_id).maybeSingle(),
        admin.storage.from('biblioteca').download(material.file_path),
      ]);

    if (downloadResult.error || !downloadResult.data) {
      return Response.json({ error: 'source_download_failed' }, { status: 502 });
    }

    const materialSegment = buildSeoEntitySlug(material.title, material.id);
    const materialUrl = `https://evaluo.com.ar/materiales/${materialSegment}`;
    const brandedBytes = await addEvaluoCover({
      originalBytes: await downloadResult.data.arrayBuffer(),
      title: material.title,
      materiaName: materia?.nombre ?? 'Materia',
      carreraName: carrera?.nombre ?? 'Carrera',
      universidadName: universidad?.nombre ?? 'Universidad',
      pageCount: material.page_count,
      materialUrl,
    });

    const downloadName = sanitizeDownloadName(material.title);
    const fallbackName = asciiFilename(downloadName) || 'material-evaluo.pdf';

    return new Response(Buffer.from(brandedBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
        ...rateLimitHeaders(rateLimit),
      },
    });
  } catch (error) {
    console.error('[student-material-download] Unable to build branded PDF', error);
    return Response.json({ error: 'download_failed' }, { status: 500 });
  }
}
