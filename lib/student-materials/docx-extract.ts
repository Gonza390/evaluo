import { inflateRawSync } from 'node:zlib';
import type { StudyDocumentAnalysis } from '@/lib/student-materials/types';

export const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const DOCX_MAX_EXTRACTED_CHARS = 500_000;
export const DOCX_FREE_MAX_EXTRACTED_CHARS = 150_000;
const MAX_XML_BYTES = 24 * 1024 * 1024;

export function isDocxFileName(name: string) {
  return /\.docx$/i.test(name.trim());
}
export function isDocxFileSignature(bytes: Uint8Array) {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b &&
    bytes[2] === 0x03 && bytes[3] === 0x04;
}
function bad(message = 'El archivo Word no es un DOCX válido.'): never {
  throw new Error(message);
}
function unzipMainParts(bytes: Uint8Array) {
  if (!isDocxFileSignature(bytes)) bad();
  const zip = Buffer.from(bytes);
  let eocd = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65557); i--) {
    if (zip.readUInt32LE(i) === 0x06054b50 &&
      i + 22 + zip.readUInt16LE(i + 20) === zip.length) { eocd = i; break; }
  }
  if (eocd < 0) bad();
  const count = zip.readUInt16LE(eocd + 10);
  let cursor = zip.readUInt32LE(eocd + 16);
  if (!count || count > 3000 || cursor >= zip.length) bad();
  const parts = new Map<string, string>();
  const wanted = new Set(['[Content_Types].xml', 'word/document.xml', 'word/styles.xml']);
  let bytesExpanded = 0;
  for (let n = 0; n < count; n++) {
    if (cursor + 46 > zip.length || zip.readUInt32LE(cursor) !== 0x02014b50) bad();
    const flags = zip.readUInt16LE(cursor + 8);
    const method = zip.readUInt16LE(cursor + 10);
    const compressed = zip.readUInt32LE(cursor + 20);
    const expanded = zip.readUInt32LE(cursor + 24);
    const nameSize = zip.readUInt16LE(cursor + 28);
    const extra = zip.readUInt16LE(cursor + 30);
    const comment = zip.readUInt16LE(cursor + 32);
    const local = zip.readUInt32LE(cursor + 42);
    if (cursor + 46 + nameSize + extra + comment > zip.length) bad();
    const path = zip.subarray(cursor + 46, cursor + 46 + nameSize).toString('utf8');
    cursor += 46 + nameSize + extra + comment;
    if (!wanted.has(path)) continue;
    if ((flags & 1) !== 0 || ![0, 8].includes(method)) bad('No aceptamos DOCX protegidos o cifrados.');
    bytesExpanded += expanded;
    if (expanded > MAX_XML_BYTES || bytesExpanded > MAX_XML_BYTES || local + 30 > zip.length ||
      zip.readUInt32LE(local) !== 0x04034b50) bad('El contenido del DOCX excede el límite de seguridad.');
    const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    if (start + compressed > zip.length) bad();
    let part: Buffer;
    try {
      const raw = zip.subarray(start, start + compressed);
      part = method === 0 ? raw : inflateRawSync(raw, { maxOutputLength: MAX_XML_BYTES });
    } catch { bad('No pudimos descomprimir el documento Word.'); }
    if (part.byteLength !== expanded) bad();
    parts.set(path, part.toString('utf8'));
  }
  if (!parts.get('word/document.xml') ||
      !parts.get('[Content_Types].xml')?.includes('wordprocessingml.document.main+xml')) bad();
  if (parts.get('[Content_Types].xml')?.includes('macroEnabled')) bad('No aceptamos documentos Word con macros.');
  return parts;
}
function decodeXml(input: string) {
  return input.replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (_m, number: string) => {
    const n = number.startsWith('x') ? parseInt(number.slice(1), 16) : parseInt(number, 10);
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
  }).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}
function paragraphText(xml: string) {
  let output = '';
  const clean = xml.replace(/<w:del\b[^>]*>[\s\S]*?<\/w:del>/g, '')
    .replace(/<w:instrText\b[^>]*>[\s\S]*?<\/w:instrText>/g, '');
  for (const hit of clean.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>|<w:tab\b[^>]*\/>|<w:br\b[^>]*\/?>/g)) {
    output += hit[1] === undefined
      ? hit[0].startsWith('<w:tab') ? ' ' : '\n'
      : decodeXml(hit[1]);
  }
  return output.replace(/[ \t]+/g, ' ').trim();
}
export type ExtractedDocx = {
  text: string;
  headings: string[];
  hasImages: boolean;
  documentAnalysis: StudyDocumentAnalysis;
};
export function extractDocxContent(bytes: Uint8Array): ExtractedDocx {
  const parts = unzipMainParts(bytes);
  const xml = parts.get('word/document.xml')!;
  const stylesXml = parts.get('word/styles.xml') ?? '';
  const styles = new Set(['Title','Subtitle','Heading1','Heading2','Heading3','heading1','heading2','heading3']);
  for (const match of stylesXml.matchAll(/<w:style\b([^>]*)>([\s\S]*?)<\/w:style>/g)) {
    const id = match[1]?.match(/\bw:styleId="([^"]+)"/)?.[1];
    if (id && /<w:name\b[^>]*w:val="(?:heading [1-6]|title|subtitle)"/i.test(match[2] ?? ''))
      styles.add(id);
  }
  const blocks: string[] = [];
  const headings: string[] = [];
  let rows = 0, bullets = 0;
  for (const hit of xml.matchAll(/<w:tr\b[^>]*>[\s\S]*?<\/w:tr>|<w:p\b[^>]*>[\s\S]*?<\/w:p>/g)) {
    const block = hit[0];
    if (block.startsWith('<w:tr')) {
      const cells = [...block.matchAll(/<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/g)]
        .map(m => [...(m[1] ?? '').matchAll(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g)]
          .map(p => paragraphText(p[0])).filter(Boolean).join('; '))
        .filter(Boolean);
      if (cells.length) { blocks.push(cells.join(' | ')); rows++; }
      continue;
    }
    const content = paragraphText(block);
    if (!content) continue;
    const style = block.match(/<w:pStyle\b[^>]*w:val="([^"]+)"/)?.[1] ?? '';
    if ((styles.has(style) || /^heading[1-6]$/i.test(style)) && content.length < 180) {
      blocks.push('\n' + content + '\n');
      headings.push(content);
    } else {
      const bullet = /<w:numPr\b/.test(block);
      blocks.push(bullet ? '• ' + content : content);
      if (bullet) bullets++;
    }
  }
  const text = blocks.join('\n\n').replace(/\n{4,}/g, '\n\n\n').trim();
  if (text.length < 120) bad('El documento Word no contiene suficiente texto legible.');
  if (text.length > DOCX_MAX_EXTRACTED_CHARS) bad('El DOCX supera el límite técnico de contenido.');
  const hasImages = /<w:drawing\b|<w:pict\b/.test(xml);
  return { text, headings, hasImages,
    documentAnalysis: {
      documentType: hasImages ? 'mixed' : 'structured_text',
      processingStrategy: 'text_native',
      hasSelectableText: true,
      hasEmbeddedImages: hasImages,
      requiresOcr: false,
      hasTables: rows > 0,
      hasLists: bullets > 0,
      structureQuality: headings.length > 0 ? 'high' : 'medium',
      pageCount: null,
      textLength: text.length,
      paragraphCount: blocks.length,
      headingCount: headings.length,
      bulletCount: bullets,
      imageCountEstimate: hasImages ? 1 : 0,
      tableLineCount: rows,
      averageCharsPerPage: 0,
      averageLinesPerPage: 0,
      analysisSummary: hasImages
        ? 'Documento Word: el texto fue extraído, pero las imágenes no se interpretaron.'
        : 'Documento Word: texto estructurado extraído sin páginas físicas.',
    },
  };
}