'use client';

import type { ReactNode } from 'react';

/**
 * Renderiza texto estructurado generado por IA (subtítulos numerados, viñetas,
 * tablas Markdown, bloques "Importante:", "Clave de estudio:" y "Ejemplo aplicado:")
 * con estilos de lectura consistentes en toda la app.
 */
export function StudyRichText({ body }: { body: string }) {
  const lines = body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const rows: Array<{ columns: string[] }> = [];
  let isCollectingTable = false;
  const content: ReactNode[] = [];

  const flushTable = (key: string) => {
    if (rows.length < 2) {
      rows.length = 0;
      return;
    }

    const header = rows[0]?.columns ?? [];
    const bodyRows = rows.slice(1).filter((row) =>
      row.columns.some((column) => !/^:?-+:?$/i.test(column))
    );

    if (header.length === 0 || bodyRows.length === 0) {
      rows.length = 0;
      return;
    }

    content.push(
      <div key={key} className="overflow-x-auto rounded-[16px] border border-slate-200">
        <table className="min-w-full border-collapse text-left text-[13px]">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              {header.map((column, index) => (
                <th key={`${column}-${index}`} className="border-b border-slate-200 px-3 py-2 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rowIndex) => (
              <tr key={`${row.columns.join('|')}-${rowIndex}`} className="bg-white">
                {row.columns.map((column, columnIndex) => (
                  <td
                    key={`${column}-${columnIndex}`}
                    className="border-t border-slate-200 px-3 py-2 align-top text-slate-600"
                  >
                    {column}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    rows.length = 0;
  };

  lines.forEach((line, index) => {
    if (line.includes('|')) {
      isCollectingTable = true;
      rows.push({
        columns: line
          .split('|')
          .map((column) => column.trim())
          .filter(Boolean),
      });
      return;
    }

    if (isCollectingTable) {
      flushTable(`table-${index}`);
      isCollectingTable = false;
    }

    if (/^\d+\.\d+\s+/.test(line)) {
      content.push(
        <h5 key={`subheading-${index}`} className="pt-1 text-[0.95rem] font-semibold text-slate-950">
          {line}
        </h5>
      );
      return;
    }

    if (/^(?:[\u2022\-])\s+/.test(line)) {
      content.push(
        <div key={`bullet-${index}`} className="flex items-start gap-2 text-[13.5px] leading-6 text-slate-700">
          <span className="mt-[0.42rem] text-[12px] text-[#2563EB]">•</span>
          <p>{line.replace(/^(?:[\u2022\-])\s+/, '')}</p>
        </div>
      );
      return;
    }

    if (/^Importante:/i.test(line)) {
      content.push(
        <div
          key={`important-${index}`}
          className="rounded-[16px] border border-[#DBEAFE] bg-[#F8FBFF] px-3.5 py-3 text-[13px] leading-6 text-slate-700"
        >
          <span className="font-semibold text-[#2563EB]">Importante:</span>{' '}
          {line.replace(/^Importante:\s*/i, '')}
        </div>
      );
      return;
    }

    if (/^Clave de estudio:/i.test(line)) {
      content.push(
        <div
          key={`study-tip-${index}`}
          className="rounded-[16px] border border-amber-200 bg-amber-50/80 px-3.5 py-3 text-[13px] leading-6 text-slate-700"
        >
          <span className="font-semibold text-amber-700">Clave de estudio:</span>{' '}
          {line.replace(/^Clave de estudio:\s*/i, '')}
        </div>
      );
      return;
    }

    if (/^Ejemplo aplicado:/i.test(line)) {
      content.push(
        <div
          key={`example-${index}`}
          className="rounded-[16px] border border-emerald-200 bg-emerald-50/80 px-3.5 py-3 text-[13px] leading-6 text-slate-700"
        >
          <span className="font-semibold text-emerald-700">Ejemplo aplicado:</span>{' '}
          {line.replace(/^Ejemplo aplicado:\s*/i, '')}
        </div>
      );
      return;
    }

    content.push(
      <p key={`paragraph-${index}`} className="text-[13.5px] leading-6 text-slate-700">
        {line}
      </p>
    );
  });

  if (isCollectingTable) {
    flushTable('table-final');
  }

  return <div className="space-y-3">{content}</div>;
}
