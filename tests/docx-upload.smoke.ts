import assert from 'node:assert/strict';
import { deflateRawSync } from 'node:zlib';
import {
  extractDocxContent, isDocxFileName, isDocxFileSignature,
} from '../lib/student-materials/docx-extract.ts';
import {
  studentMaterialFileKind, isSupportedStudentMaterialFile,
} from '../lib/student-materials/validation.ts';

function zip(parts: Record<string, string>) {
  const locals: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const [filename, text] of Object.entries(parts)) {
    const name = Buffer.from(filename);
    const data = Buffer.from(text);
    const compressed = deflateRawSync(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name, compressed);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0);
    record.writeUInt16LE(20, 4);
    record.writeUInt16LE(20, 6);
    record.writeUInt16LE(8, 10);
    record.writeUInt32LE(compressed.length, 20);
    record.writeUInt32LE(data.length, 24);
    record.writeUInt16LE(name.length, 28);
    record.writeUInt32LE(offset, 42);
    central.push(record, name);
    offset += local.length + name.length + compressed.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(central.length / 2, 8);
  end.writeUInt16LE(central.length / 2, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}
const styles = '<w:styles><w:style w:styleId="Heading1"><w:name w:val="heading 1"/></w:style></w:styles>';
const body = '<w:document><w:body>' +
  '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Marketing estratégico</w:t></w:r></w:p>' +
  '<w:p><w:r><w:t>La segmentación de mercados permite dividir el público en grupos con necesidades, hábitos y comportamientos comparables. La propuesta de valor debe responder a problemas reales de cada segmento.</w:t></w:r></w:p>' +
  '<w:p><w:pPr><w:numPr/></w:pPr><w:r><w:t>Identificar objetivos y evaluar indicadores relevantes.</w:t></w:r></w:p>' +
  '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Demográfica</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Edad e ingresos</w:t></w:r></w:p></w:tc></w:tr></w:tbl>' +
  '<w:p><w:r><w:drawing/></w:r><w:r><w:t>El análisis se complementa con encuestas, entrevistas y seguimiento de resultados a lo largo del ciclo comercial.</w:t></w:r></w:p>' +
  '</w:body></w:document>';
const docx = zip({
  '[Content_Types].xml': '<Types>wordprocessingml.document.main+xml</Types>',
  'word/styles.xml': styles,
  'word/document.xml': body,
});
assert.equal(isDocxFileSignature(docx), true);
assert.equal(isDocxFileName('apuntes.docx'), true);
assert.equal(isDocxFileName('archivo.docm'), false);
assert.equal(studentMaterialFileKind('apuntes.docx'), 'docx');
assert.equal(isSupportedStudentMaterialFile('apuntes.docx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'), true);
assert.equal(isSupportedStudentMaterialFile('archivo.exe', ''), false);
assert.equal(isSupportedStudentMaterialFile('apuntes.docx', 'application/pdf'), false);
const result = extractDocxContent(docx);
assert.match(result.text, /Marketing estratégico/);
assert.match(result.text, /segmentación de mercados/);
assert.match(result.text, /Demográfica \| Edad e ingresos/);
assert.deepEqual(result.headings, ['Marketing estratégico']);
assert.equal(result.documentAnalysis.pageCount, null);
assert.equal(result.documentAnalysis.hasTables, true);
assert.equal(result.documentAnalysis.hasLists, true);
assert.equal(result.hasImages, true);
assert.throws(() => extractDocxContent(Buffer.from('not a docx')), /DOCX válido/);
assert.throws(() => extractDocxContent(zip({
  '[Content_Types].xml': '<Types>wordprocessingml.document.main+xml</Types>',
  'word/document.xml': '<w:document></w:document>',
})), /suficiente texto/);
assert.throws(() => extractDocxContent(zip({
  '[Content_Types].xml': '<Types>wordprocessingml.document.macroEnabled.main+xml</Types>',
  'word/document.xml': body,
})), /DOCX válido|macros/);
console.log('DOCX extraction and format validation smoke tests passed.');
