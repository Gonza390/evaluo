// Material original y determinista del preview; comparte el texto con la interfaz.
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { mkdir, writeFile } from 'node:fs/promises';
import { samplePdf } from '../components/preview/first-pdf-preview-data.ts';

const document = await PDFDocument.create();
document.setTitle(samplePdf.title);
document.setAuthor('Evaluo');
const regular = await document.embedFont(StandardFonts.Helvetica);
const bold = await document.embedFont(StandardFonts.HelveticaBold);
const ink = rgb(0.06, 0.1, 0.2);
const blue = rgb(0.02, 0.35, 0.85);
const sections = [
  [
    'Asociación no significa causa',
    'Antes de aceptar una explicación, preguntá qué otras variables podrían influir. Una encuesta puede mostrar una asociación sin identificar su causa.',
  ],
  [
    'Comparar con cuidado',
    'Una comparación aporta más información cuando se mantiene similar lo demás. Evitá atribuir una diferencia a una técnica si también cambió el tiempo de estudio.',
  ],
];

for (let index = 0; index < 2; index++) {
  const page = document.addPage([595, 842]);
  let y = 770;
  const text = (value, size = 12, font = regular, color = ink) => {
    const words = value.split(' ');
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > 475) {
        page.drawText(line, { x: 60, y, size, font, color });
        y -= size * 1.65;
        line = word;
      } else line = candidate;
    }
    if (line) {
      page.drawText(line, { x: 60, y, size, font, color });
      y -= size * 1.65;
    }
    y -= 18;
  };
  text('evaluo. / Material de ejemplo', 12, bold, blue);
  text(samplePdf.title, 25, bold);
  text(sections[index][0], 17, bold);
  text(samplePdf.fragments[index], 13);
  text('Para recordar', 14, bold, blue);
  text(sections[index][1], 12);
  page.drawLine({
    start: { x: 60, y: 90 },
    end: { x: 535, y: 90 },
    thickness: 1,
    color: rgb(0.85, 0.87, 0.9),
  });
  page.drawText(`Contenido original de muestra - Evaluo - Página ${index + 1} de 2`, {
    x: 60,
    y: 65,
    size: 9,
    font: regular,
    color: ink,
  });
}
await mkdir('public/demo', { recursive: true });
await writeFile('public/demo/interpretar-una-investigacion.pdf', await document.save());
console.log('PDF de muestra creado: 2 páginas.');
