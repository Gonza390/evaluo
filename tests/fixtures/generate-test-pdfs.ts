import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const A4_WIDTH = 595;
const A4_HEIGHT = 842;
const MARGIN = 56;

const OUTPUT_DIR = resolve(import.meta.dirname, '../../test-data');

type ContentItem =
  | { kind: 'text'; x: number; y: number; size: number; text: string }
  | { kind: 'image'; buffer: Buffer; width: number; height: number; x: number; y: number };

type RawPdfOptions = { pages: ContentItem[][] };

function escapePdfString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function toLatin1(value: string): Buffer {
  const bytes: number[] = [];
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    bytes.push(code <= 0xff ? code : 63);
  }
  return Buffer.from(bytes);
}

function wrapText(text: string, widthPx: number, size: number): string[] {
  const approxCharWidth = size * 0.5;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length * approxCharWidth <= widthPx || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildContentStream(items: ContentItem[], fontObjNumber: number): Buffer {
  const parts: string[] = [];
  const hasImage = items.some((item) => item.kind === 'image');

  for (const item of items) {
    if (item.kind === 'text') {
      for (const line of wrapText(item.text, A4_WIDTH - MARGIN * 2, item.size)) {
        const y = Math.round(A4_HEIGHT - item.y);
        parts.push(`BT /F${fontObjNumber} ${item.size} Tf ${item.x} ${y} Td (${escapePdfString(line)}) Tj ET`);
      }
    }
  }

  let imageIndex = 0;
  for (const item of items) {
    if (item.kind === 'image') {
      imageIndex += 1;
      parts.push(`q ${item.width} 0 0 ${item.height} ${item.x} ${Math.round(A4_HEIGHT - item.y - item.height)} cm /Im${imageIndex} Do Q`);
    }
  }

  if (!hasImage && parts.length === 0) {
    parts.push('BT /F1 11 Tf 56 790 Td () Tj ET');
  }

  return toLatin1(parts.join('\n'));
}

function buildRawPdf(options: RawPdfOptions): Buffer {
  const pages = options.pages;
  const pageCount = pages.length;
  const imageObjects: Array<{ number: number; buffer: Buffer; width: number; height: number }> = [];

  // Object numbering: 1 catalog, 2 pages, then per page (page obj, content obj), then font, then images.
  const fontObjNumber = 3 + pageCount * 2;
  let nextImageNumber = fontObjNumber + 1;
  const pageObjects: Array<{ pageNumber: number; contentNumber: number }> = [];
  for (let index = 0; index < pageCount; index += 1) {
    const pageNumber = 3 + index * 2;
    const contentNumber = pageNumber + 1;
    pageObjects.push({ pageNumber, contentNumber });
  }

  const header = toLatin1('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const objects: Array<{ number: number; offset: number; raw: Buffer }> = [];
  let offset = header.length;

  const pushObject = (number: number, body: Buffer) => {
    const raw = Buffer.concat([
      toLatin1(`${number} 0 obj\n`),
      body,
      toLatin1('\nendobj\n'),
    ]);
    objects.push({ number, offset, raw });
    offset += raw.length;
  };

  const pushTextObject = (number: number, text: string) => {
    pushObject(number, toLatin1(text));
  };

  pushTextObject(1, '<< /Type /Catalog /Pages 2 0 R >>');

  const kids = pageObjects.map((page) => `${page.pageNumber} 0 R`).join(' ');
  pushTextObject(2, `<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`);

  for (let index = 0; index < pageCount; index += 1) {
    const page = pageObjects[index];
    const items = pages[index];

    let imageResources = '';
    let currentImage = 0;
    const imageEntries: string[] = [];
    for (const item of items) {
      if (item.kind === 'image') {
        currentImage += 1;
        const imageObjNumber = nextImageNumber;
        imageObjects.push({
          number: imageObjNumber,
          buffer: item.buffer,
          width: item.width,
          height: item.height,
        });
        imageEntries.push(`/Im${currentImage} ${imageObjNumber} 0 R`);
        nextImageNumber += 1;
      }
    }
    if (imageEntries.length > 0) {
      imageResources = ` /XObject << ${imageEntries.join(' ')} >>`;
    }

    pushTextObject(
      page.pageNumber,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_WIDTH} ${A4_HEIGHT}] /Resources << /Font << /F${fontObjNumber} ${fontObjNumber} 0 R >>${imageResources} >> /Contents ${page.contentNumber} 0 R >>`
    );

    const contentStream = buildContentStream(items, fontObjNumber);
    const contentBody = toLatin1(
      `<< /Length ${contentStream.length} >>\nstream\n`
    );
    const stream = Buffer.concat([contentBody, contentStream, toLatin1('\nendstream')]);
    pushObject(page.contentNumber, stream);
  }

  pushTextObject(fontObjNumber, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  for (const image of imageObjects) {
    pushObject(
      image.number,
      Buffer.concat([
        toLatin1(
          `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.buffer.length} >>\nstream\n`
        ),
        image.buffer,
        toLatin1('\nendstream'),
      ])
    );
  }

  const sortedObjects = objects.sort((a, b) => a.number - b.number);
  const maxNumber = Math.max(...sortedObjects.map((object) => object.number));

  const xrefOffset = offset;
  let xref = toLatin1(`xref\n0 ${maxNumber + 1}\n`);
  xref = Buffer.concat([xref, toLatin1('0000000000 65535 f \n')]);
  for (let number = 1; number <= maxNumber; number += 1) {
    const object = sortedObjects.find((item) => item.number === number);
    const entry = object
      ? `${String(object.offset).padStart(10, '0')} 00000 n \n`
      : '0000000000 65535 f \n';
    xref = Buffer.concat([xref, toLatin1(entry)]);
  }

  const trailer = toLatin1(
    `trailer\n<< /Size ${maxNumber + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  return Buffer.concat([
    header,
    ...objects.sort((a, b) => a.offset - b.offset).map((object) => object.raw),
    xref,
    trailer,
  ]);
}

async function createJpeg(width: number, height: number, blocks: Array<{ x: number; y: number; w: number; h: number; color: string }>) {
  return sharp({
    create: { width: Math.round(width), height: Math.round(height), channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite(
      blocks.map((block) => ({
        input: Buffer.from(
          `<svg width="${Math.round(width)}" height="${Math.round(height)}" xmlns="http://www.w3.org/2000/svg"><rect x="${Math.round(block.x)}" y="${Math.round(block.y)}" width="${Math.round(block.w)}" height="${Math.round(block.h)}" fill="${block.color}"/></svg>`
        ),
        left: 0,
        top: 0,
      }))
    )
    .jpeg({ quality: 80 })
    .toBuffer();
}

function textItems(lines: Array<{ text: string; size?: number; x?: number; y?: number }>, startY = 80): ContentItem[] {
  const items: ContentItem[] = [];
  let y = startY;
  for (const line of lines) {
    const size = line.size ?? 11;
    items.push({ kind: 'text', x: line.x ?? MARGIN, y, size, text: line.text });
    y += size * 1.5 + 4;
  }
  return items;
}

function textLines(input: string[], headingSize = 15, bodySize = 11): Array<{ text: string; size?: number }> {
  return input.map((line) => {
    if (/^UNIDAD|^[A-Z ]{4,}$/.test(line) || /^\d+\.\d+/.test(line)) {
      return { text: line, size: headingSize };
    }
    return { text: line, size: bodySize };
  });
}

async function buildTextNative(): Promise<Buffer> {
  const sections = [
    'UNIDAD 1. FILOSOFIA DEL DERECHO: INTRODUCCION',
    'La filosofia del derecho es la rama de la filosofia que reflexiona sobre el sentido, la validez y los fines de las normas juridicas. Se distingue de la dogmatica juridica porque no se limita a describir el derecho vigente, sino que pregunta por su fundamento.',
    '1.1 El derecho como objeto de estudio',
    'El derecho puede ser estudiado desde tres dimensiones: la dimension normativa, que analiza las reglas; la dimension factual, que estudia los hechos sociales; y la dimension axiologica, que valora la justicia de las normas.',
    'Dimensiones del derecho:',
    '- Normativa: el conjunto de leyes y decretos que regulan la conducta.',
    '- Factual: las practicas sociales que dan origen al derecho.',
    '- Axiologica: los valores de justicia, igualdad y libertad.',
    '1.2 La justicia como ideal regulativo',
    'Para Hans Kelsen la justicia es un ideal irracional, mientras que para John Rawls es el resultado de un acuerdo bajo un velo de ignorancia. Ambas posturas influyen en el debate contemporaneo.',
    '1.3 Fuentes del derecho',
    'Las fuentes formales del derecho son la ley, la costumbre, la jurisprudencia y la doctrina. La jerarquia entre ellas depende de cada sistema juridico.',
    'Tabla de jerarquia:',
    '| Fuente | Caracteristica | Ejemplo |',
    '| Ley | Norma escrita sancionada por el legislador | Codigo Civil |',
    '| Costumbre | Practica reiterada con valor normativo | Usos comerciales |',
    '| Jurisprudencia | Criterios de los tribunales | Fallos de Corte |',
    '| Doctrina | Estudios de los juristas | Tratados academicos |',
    'UNIDAD 2. TEORIAS DE LA JUSTICIA',
    'El utilitarismo sostiene que una accion es justa si maximiza la felicidad general. El iusnaturalismo afirma que existe un derecho natural superior al positivo, y el positivismo juridico defiende la separacion entre derecho y moral.',
    '2.1 Utilitarismo',
    'Jeremy Bentham propuso el principio de utilidad como criterio para legislar. John Stuart Mill lo reformulo distinguiendo placeres superiores e inferiores.',
    '2.2 Iusnaturalismo',
    'Tomas de Aquino sostuvo que la ley injusta no obliga en conciencia. La escuela racionalista moderna traslado ese fundamento de la revelacion a la razon.',
    '2.3 Positivismo juridico',
    'Hans Kelsen construyo una piramide normativa donde la validez de una norma depende de la norma superior. La norma fundamental es el supuesto ultimo de todo el sistema.',
    'UNIDAD 3. INTERPRETACION Y APLICACION DEL DERECHO',
    'Interpretar el derecho es determinar el sentido de las normas para aplicarlas a casos concretos. Existen metodos literal, historico, sistematico y teleologico.',
    '- Metodo literal: atiende al texto de la norma.',
    '- Metodo historico: reconstruye la voluntad del legislador.',
    '- Metodo sistematico: integra la norma en el ordenamiento completo.',
    '- Metodo teleologico: busca la finalidad que persigue la norma.',
  ];

  const lines = textLines(sections);
  const pages: ContentItem[][] = [];
  for (let index = 0; index < lines.length; index += 7) {
    pages.push(textItems(lines.slice(index, index + 7)));
  }
  return buildRawPdf({ pages });
}

async function buildSlides(): Promise<Buffer> {
  const slides = [
    { title: 'INTRODUCCION A LA PSICOLOGIA', bullets: ['Definicion de psicologia', 'Historia breve de la disciplina', 'Ramas principales', 'Metodos de investigacion'] },
    { title: 'LA PERCEPCION', bullets: ['Definicion de percepcion', 'Diferencia entre sensacion y percepcion', 'Leyes de la Gestalt', 'Constancia perceptual'] },
    { title: 'EL APRENDIZAJE', bullets: ['Condicionamiento clasico (Pavlov)', 'Condicionamiento operante (Skinner)', 'Aprendizaje por observacion (Bandura)', 'Refuerzo y castigo'] },
    { title: 'LA MEMORIA', bullets: ['Memoria sensorial', 'Memoria a corto plazo', 'Memoria a largo plazo', 'Olvido y amnesia'] },
    { title: 'LA MOTIVACION', bullets: ['Teorias de la motivacion', 'Jerarquia de Maslow', 'Motivacion intrinseca y extrinseca', 'Relacion con la emocion'] },
    { title: 'LA EMOCION', bullets: ['Componentes de la emocion', 'Teorias clasicas', 'Inteligencia emocional', 'Regulacion emocional'] },
  ];

  const pages: ContentItem[][] = slides.map((slide) => [
    { kind: 'text', x: 70, y: 120, size: 26, text: slide.title },
    ...slide.bullets.map((bullet, index) => ({
      kind: 'text' as const, x: 90, y: 200 + index * 42, size: 13, text: `- ${bullet}`,
    })),
  ]);
  return buildRawPdf({ pages });
}

async function buildHybrid(): Promise<Buffer> {
  const diagram = await createJpeg(300, 180, [
    { x: 20, y: 20, w: 120, h: 60, color: '#cfe8ff' },
    { x: 170, y: 20, w: 110, h: 60, color: '#ffe6b3' },
    { x: 20, y: 100, w: 120, h: 60, color: '#d9f2d9' },
    { x: 170, y: 100, w: 110, h: 60, color: '#f2d9d9' },
  ]);
  const diagram2 = await createJpeg(240, 140, [
    { x: 30, y: 30, w: 80, h: 40, color: '#fff2cc' },
    { x: 140, y: 30, w: 70, h: 40, color: '#d9e8ff' },
  ]);

  const page1: ContentItem[] = [
    { kind: 'text', x: MARGIN, y: 80, size: 14, text: 'TEORIA DE LA OFERTA Y LA DEMANDA' },
    { kind: 'text', x: MARGIN, y: 120, size: 11, text: 'La ley de la demanda establece que, manteniendo todo lo demas constante, la cantidad demandada de un bien aumenta cuando su precio disminuye. La curva de demanda tiene pendiente negativa.' },
    { kind: 'text', x: MARGIN, y: 160, size: 11, text: 'La oferta, en cambio, relaciona el precio con la cantidad que los productores estan dispuestos a vender. La curva de oferta tiene pendiente positiva en el corto plazo.' },
    { kind: 'text', x: MARGIN, y: 200, size: 11, text: 'El equilibrio de mercado ocurre donde la oferta y la demanda se cruzan. En ese punto, la cantidad ofrecida es igual a la cantidad demandada.' },
    { kind: 'image', buffer: diagram, width: 300, height: 180, x: 150, y: 260 },
  ];

  const page2: ContentItem[] = [
    { kind: 'text', x: MARGIN, y: 80, size: 14, text: 'DESPLAZAMIENTOS DE LA CURVA' },
    { kind: 'text', x: MARGIN, y: 120, size: 11, text: 'Un aumento del ingreso de los consumidores desplaza la demanda hacia la derecha. Un cambio en el precio de los insumos desplaza la oferta.' },
    { kind: 'text', x: MARGIN, y: 160, size: 11, text: 'Los bienes inferiores se comportan de manera inversa: su demanda cae cuando el ingreso sube.' },
    { kind: 'image', buffer: diagram2, width: 240, height: 140, x: 160, y: 240 },
    { kind: 'text', x: MARGIN, y: 430, size: 11, text: 'La elasticidad mide la sensibilidad de la cantidad demandada ante cambios en el precio. Un bien es elastico cuando la demanda responde mucho a pequenas variaciones del precio.' },
  ];

  return buildRawPdf({ pages: [page1, page2] });
}

async function buildScanned(): Promise<Buffer> {
  const scanned1 = await createJpeg(A4_WIDTH, A4_HEIGHT, [
    { x: 60, y: 90, w: 470, h: 26, color: '#333333' },
    { x: 60, y: 130, w: 380, h: 12, color: '#888888' },
    { x: 60, y: 152, w: 440, h: 12, color: '#aaaaaa' },
    { x: 60, y: 174, w: 420, h: 12, color: '#bbbbbb' },
    { x: 60, y: 210, w: 300, h: 22, color: '#e0e0e0' },
    { x: 60, y: 236, w: 240, h: 10, color: '#cccccc' },
    { x: 60, y: 280, w: 360, h: 22, color: '#e0e0e0' },
    { x: 60, y: 306, w: 290, h: 10, color: '#cccccc' },
    { x: 60, y: 350, w: 260, h: 22, color: '#e0e0e0' },
    { x: 60, y: 376, w: 310, h: 10, color: '#cccccc' },
    { x: 60, y: 420, w: 330, h: 22, color: '#e0e0e0' },
    { x: 60, y: 446, w: 210, h: 10, color: '#cccccc' },
  ]);
  const scanned2 = await createJpeg(A4_WIDTH, A4_HEIGHT, [
    { x: 60, y: 110, w: 430, h: 24, color: '#444444' },
    { x: 60, y: 150, w: 400, h: 12, color: '#999999' },
    { x: 60, y: 230, w: 340, h: 22, color: '#dddddd' },
    { x: 60, y: 256, w: 270, h: 10, color: '#c0c0c0' },
    { x: 60, y: 330, w: 380, h: 22, color: '#dddddd' },
    { x: 60, y: 356, w: 230, h: 10, color: '#c0c0c0' },
  ]);

  return buildRawPdf({
    pages: [
      [{ kind: 'image', buffer: scanned1, width: A4_WIDTH, height: A4_HEIGHT, x: 0, y: 0 }],
      [{ kind: 'image', buffer: scanned2, width: A4_WIDTH, height: A4_HEIGHT, x: 0, y: 0 }],
    ],
  });
}

async function buildLong(): Promise<Buffer> {
  const topics = [
    ['LA ORGANIZACION DEL ESTADO', 'La organizacion del Estado argentino se define en la Constitucion Nacional. Se trata de una republica representativa, federal y presidencialista, con tres poderes independientes que se controlan entre si.'],
    ['EL PODER EJECUTIVO', 'El Poder Ejecutivo esta encabezado por el presidente de la Nacion, que es a la vez jefe de Estado y jefe de gobierno. Cuenta con el apoyo del gabinete de ministros y del Jefe de Gabinete, figura creada por la reforma constitucional de 1994.'],
    ['EL PODER LEGISLATIVO', 'El Congreso Nacional es bicameral: la Camara de Diputados representa al pueblo y la Camara de Senadores a las provincias. Su funcion principal es sancionar leyes, aprobar el presupuesto y ejercer el control del Poder Ejecutivo.'],
    ['EL PODER JUDICIAL', 'La Corte Suprema de Justicia encabeza el Poder Judicial. Los jueces son designados por el presidente con acuerdo del Senado y gozan de estabilidad mientras dure su buena conducta.'],
    ['EL FEDERALISMO', 'El federalismo argentino reconoce la autonomia de las provincias y de la Ciudad de Buenos Aires. Las provincias conservan los poderes no delegados a la Nacion y participan en la formacion de las leyes nacionales a traves del Senado.'],
    ['LA REFORMA DE 1994', 'La reforma constitucional de 1994 incorporo nuevos derechos y garantias, los tratados internacionales de derechos humanos, el Defensor del Pueblo, la Auditoria General y la posibilidad de reeleccion presidencial.'],
  ];

  const lines: string[] = [];
  for (let round = 0; round < 6; round += 1) {
    for (const [title, body] of topics) {
      lines.push(title);
      lines.push(body);
      lines.push(`En el capitulo ${round + 1} se profundiza este analisis con fuentes documentales y bibliografia complementaria. La discusion academica sobre este tema incluye multiples perspectivas teoricas que conviene conocer antes del examen.`);
      lines.push(`- Punto clave: ${title.toLowerCase()} tiene implicancias directas en la vida institucional.`);
      lines.push(`- Ejemplo: casos practicos resueltos en tribunales y en la gestion publica.`);
      lines.push(`- Dato: la bibliografia recomendada incluye a autores clasicos y a la doctrina contemporanea.`);
    }
  }

  const pages: ContentItem[][] = [];
  for (let index = 0; index < lines.length; index += 7) {
    pages.push(textItems(textLines(lines.slice(index, index + 7))));
  }
  return buildRawPdf({ pages });
}

async function buildNoisy(): Promise<Buffer> {
  const content = [
    'UNIVERSIDAD NACIONAL DE PRUEBA - CATEDRA DE GEOGRAFIA',
    'UNIDAD 1. BIOMAS DE LA ARGENTINA',
    'Un bioma es una comunidad biologica determinada por el clima, el suelo y la vegetacion dominante. La Argentina presenta una gran diversidad de biomas a lo largo de su territorio.',
    'lOMoAR cPSD|12345678',
    'La selva misionera, el bosque chaqueño, la pampa, el monte y la estepa patagonica son los principales biomas del pais.',
    'Descargado por Carlos Gomez el 15/03/2024',
    '1.1 La selva misionera',
    'La selva misionera se ubica en el noreste, sobre la provincia de Misiones. Presenta alta biodiversidad y lluvias abundantes durante todo el ano.',
    'hola alguien tiene el resumen de esta unidad?',
    'Algunas especies caracteristicas son el yaguarete, el tapir y la palmera pindó.',
    'https://www.ejemplo.com/materiales/geografia-biomas',
    '1.2 El bosque chaqueño',
    'El bosque chaqueño abarca parte de Formosa, Chaco, Salta y Santiago del Estero. Su clima es subtropical con una marcada estacion seca.',
    'contacto@ejemplo-educativo.com',
    'Las especies tipicas incluyen el quebracho colorado y el algarrobo.',
    'Descargado por Maria Lopez el 02/02/2024',
    '1.3 La estepa patagonica',
    'La estepa patagonica se extiende desde el sur de Mendoza hasta Tierra del Fuego. Predominan los arbustos bajos y las gramineas resistentes a la sequia.',
    'lOMoAR cPSD|99999999',
    'Tabla de biomas:',
    '| Bioma | Region | Clima | Vegetacion |',
    '| Selva misionera | Noreste | Humedo | Selva densa |',
    '| Bosque chaqueño | Norte | Subtropical seco | Quebracho |',
    '| Estepa patagonica | Sur | Arido y frio | Arbustos |',
    'gente como va el tema de la tabla? no me sale',
    'UNIVERSIDAD NACIONAL DE PRUEBA - CATEDRA DE GEOGRAFIA',
  ];

  const pages: ContentItem[][] = [];
  for (let index = 0; index < content.length; index += 7) {
    pages.push(textItems(textLines(content.slice(index, index + 7), 13, 11)));
  }
  return buildRawPdf({ pages });
}

async function buildColumns(): Promise<Buffer> {
  const leftCol = [
    'SEMIOLOGIA Y COMUNICACION',
    'La semiologia estudia los signos y los sistemas de significacion. Ferdinand de Saussure la definio como la ciencia de la vida de los signos en el seno de la vida social.',
    'El signo linguistico se compone de un significante y un significado. La relacion entre ambos es arbitraria y convencional.',
    'Charles Peirce, en cambio, propuso una triada: el signo, el objeto y el interpretante. Distingue iconos, indices y simbolos.',
  ];
  const rightCol = [
    'PARADIGMA DE LA COMUNICACION',
    'El esquema de Shannon y Weaver describe la comunicacion como un proceso lineal: fuente, codificador, canal, decodificador y receptor.',
    'La teoria de los actos de habla de Austin sostiene que decir es hacer: los enunciados pueden ser locutivos, ilocutivos y perlocutivos.',
    'La escuela de Palo Alto cuestiono el modelo lineal y propuso concebir la comunicacion como interaccion sistemica.',
  ];

  const colWidth = (A4_WIDTH - MARGIN * 2 - 40) / 2;
  const leftX = MARGIN;
  const rightX = MARGIN + colWidth + 40;

  const page: ContentItem[] = [];
  let yLeft = 80;
  for (const line of leftCol) {
    page.push({ kind: 'text', x: leftX, y: yLeft, size: line === line.toUpperCase() ? 13 : 10, text: line });
    yLeft += 40;
  }
  let yRight = 80;
  for (const line of rightCol) {
    page.push({ kind: 'text', x: rightX, y: yRight, size: line === line.toUpperCase() ? 13 : 10, text: line });
    yRight += 40;
  }

  return buildRawPdf({ pages: [page] });
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const builders: Array<{ name: string; label: string; build: () => Promise<Buffer> }> = [
    { name: '01-texto-nativo.pdf', label: 'texto con estructura nativa (text_native)', build: buildTextNative },
    { name: '02-diapositivas.pdf', label: 'estilo diapositivas (slide_layout)', build: buildSlides },
    { name: '03-hibrido.pdf', label: 'texto + imagenes (hybrid_text)', build: buildHybrid },
    { name: '04-escaneado.pdf', label: 'escaneado sin capa de texto (ocr_recommended)', build: buildScanned },
    { name: '05-largo.pdf', label: 'documento largo para chunking', build: buildLong },
    { name: '06-con-ruido.pdf', label: 'con ruido de foros/watermarks', build: buildNoisy },
    { name: '07-columnas.pdf', label: 'a dos columnas', build: buildColumns },
  ];

  const results: string[] = [];
  for (const item of builders) {
    const buffer = await item.build();
    const filePath = join(OUTPUT_DIR, item.name);
    writeFileSync(filePath, buffer);
    const sizeKb = Math.round(statSync(filePath).size / 1024);
    results.push(`  ${item.name.padEnd(26)} ${sizeKb.toString().padStart(5)} KB  ->  ${item.label}`);
  }

  console.log(`PDFs de prueba generados en ${OUTPUT_DIR}\n`);
  console.log(results.join('\n'));
  console.log('\nNota: el caso "PDF protegido con contrasena" no se genera sin herramientas externas (pdf-lib no puede cifrar).');
  console.log('El comportamiento de un PDF cifrado es similar al escaneado (texto vacio).');
  console.log('\nSubilos desde el dashboard (materiales) o analizalos con:');
  console.log('  node --experimental-strip-types --import ./tests/alias-loader.mjs tests/analyze-material.ts test-data/01-texto-nativo.pdf');
}

main().catch((error) => {
  console.error('No se pudieron generar los PDFs:', error);
  process.exitCode = 1;
});
