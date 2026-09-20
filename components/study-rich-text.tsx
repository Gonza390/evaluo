'use client';

import type { ReactNode } from 'react';
import {
  BookOpenCheck,
  CircleAlert,
  FileText,
  Lightbulb,
  ListTree,
  Sigma,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type StudyCalloutKind =
  | 'important'
  | 'study-tip'
  | 'example'
  | 'definition'
  | 'classification'
  | 'process'
  | 'formula'
  | 'confusion';

type StudyCalloutConfig = {
  label: string;
  icon: typeof Sparkles;
  containerClassName: string;
  iconClassName: string;
  labelClassName: string;
};

const CALLOUT_CONFIG: Record<StudyCalloutKind, StudyCalloutConfig> = {
  important: {
    label: 'Importante',
    icon: Sparkles,
    containerClassName: 'border-blue-200 bg-blue-50/70',
    iconClassName: 'bg-blue-100 text-blue-700',
    labelClassName: 'text-blue-800',
  },
  'study-tip': {
    label: 'Clave de estudio',
    icon: Lightbulb,
    containerClassName: 'border-amber-200 bg-amber-50/75',
    iconClassName: 'bg-amber-100 text-amber-700',
    labelClassName: 'text-amber-800',
  },
  example: {
    label: 'Ejemplo aplicado',
    icon: BookOpenCheck,
    containerClassName: 'border-emerald-200 bg-emerald-50/70',
    iconClassName: 'bg-emerald-100 text-emerald-700',
    labelClassName: 'text-emerald-800',
  },
  definition: {
    label: 'Definición',
    icon: BookOpenCheck,
    containerClassName: 'border-sky-200 bg-sky-50/65',
    iconClassName: 'bg-sky-100 text-sky-700',
    labelClassName: 'text-sky-800',
  },
  classification: {
    label: 'Clasificación',
    icon: ListTree,
    containerClassName: 'border-violet-200 bg-violet-50/60',
    iconClassName: 'bg-violet-100 text-violet-700',
    labelClassName: 'text-violet-800',
  },
  process: {
    label: 'Proceso',
    icon: Workflow,
    containerClassName: 'border-cyan-200 bg-cyan-50/60',
    iconClassName: 'bg-cyan-100 text-cyan-700',
    labelClassName: 'text-cyan-800',
  },
  formula: {
    label: 'Fórmula',
    icon: Sigma,
    containerClassName: 'border-indigo-200 bg-indigo-50/60',
    iconClassName: 'bg-indigo-100 text-indigo-700',
    labelClassName: 'text-indigo-800',
  },
  confusion: {
    label: 'Confusión frecuente',
    icon: CircleAlert,
    containerClassName: 'border-rose-200 bg-rose-50/60',
    iconClassName: 'bg-rose-100 text-rose-700',
    labelClassName: 'text-rose-800',
  },
};

const PAGE_REFERENCE_PATTERN =
  /\s*Ver en PDF\s*·\s*página(?:s)?\s+([0-9]+(?:\s*,\s*[0-9]+)*)\s*\.?\s*$/iu;

function extractPageReference(value: string) {
  const match = value.match(PAGE_REFERENCE_PATTERN);
  if (!match) {
    return {
      text: value.trim(),
      pageReference: null as string | null,
    };
  }

  const pages = (match[1] ?? '')
    .split(',')
    .map((page) => page.trim())
    .filter(Boolean);

  return {
    text: value.replace(PAGE_REFERENCE_PATTERN, '').trim(),
    pageReference:
      pages.length === 1
        ? `Ver en PDF · pág. ${pages[0]}`
        : `Ver en PDF · págs. ${pages.join(', ')}`,
  };
}

const INLINE_MARKUP_PATTERN =
  /(\*\*[^*]+\*\*|`[^`]+`|\$\$[^$]+\$\$|\$[^$\n]+\$|\\\\\([^)]*\\\\\)|\\\\\[[^\]]*\\\\\])/gu;

function normalizeMathExpression(value: string) {
  let output = value.trim();

  for (let pass = 0; pass < 4; pass += 1) {
    const next = output
      .replace(/\\\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/gu, '($1)/($2)')
      .replace(/\\\\sqrt\s*\{([^{}]+)\}/gu, '√($1)');
    if (next === output) break;
    output = next;
  }

  return output
    .replace(/\\\\text\s*\{([^{}]*)\}/gu, '$1')
    .replace(/\\\\mathrm\s*\{([^{}]*)\}/gu, '$1')
    .replace(/\\\\operatorname\s*\{([^{}]*)\}/gu, '$1')
    .replace(/\\\\times\b/gu, '×')
    .replace(/\\\\cdot\b/gu, '·')
    .replace(/\\\\leq?\b/gu, '≤')
    .replace(/\\\\geq?\b/gu, '≥')
    .replace(/\\\\neq\b/gu, '≠')
    .replace(/\\\\Rightarrow\b/gu, '⇒')
    .replace(/\\\\to\b/gu, '→')
    .replace(/\\\\pm\b/gu, '±')
    .replace(/\\\\%/gu, '%')
    .replace(/\\\\_/gu, '_')
    .replace(/\\\\([A-Za-z]+)/gu, '$1')
    .replace(/[{}]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

function unwrapMathToken(token: string) {
  if (token.startsWith('$') && token.endsWith('$')) return token.slice(2, -2);
  if (token.startsWith('

function getCallout(line: string): {
  kind: StudyCalloutKind;
  content: string;
} | null {
  const definitions: Array<{
    kind: StudyCalloutKind;
    pattern: RegExp;
  }> = [
    { kind: 'important', pattern: /^Importante:\s*/iu },
    { kind: 'study-tip', pattern: /^Clave de estudio:\s*/iu },
    { kind: 'example', pattern: /^Ejemplo aplicado:\s*/iu },
    { kind: 'definition', pattern: /^(?:Definición|Concepto clave):\s*/iu },
    { kind: 'classification', pattern: /^(?:Clasificación|Tipos):\s*/iu },
    { kind: 'process', pattern: /^(?:Proceso|Etapas|Pasos):\s*/iu },
    { kind: 'formula', pattern: /^Fórmula:\s*/iu },
    {
      kind: 'confusion',
      pattern: /^(?:Confusión frecuente|Error frecuente):\s*/iu,
    },
  ];

  for (const definition of definitions) {
    if (!definition.pattern.test(line)) continue;

    return {
      kind: definition.kind,
      content: line.replace(definition.pattern, '').trim(),
    };
  }

  return null;
}

function renderPageReference(pageReference: string | null, key: string) {
  if (!pageReference) return null;

  return (
    <div key={`${key}-reference`} className="pt-1">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
        <FileText className="h-3 w-3 text-[#2563EB]" />
        {pageReference}
      </span>
    </div>
  );
}

function StudyCallout({
  kind,
  content,
  pageReference,
  itemKey,
}: {
  kind: StudyCalloutKind;
  content: string;
  pageReference: string | null;
  itemKey: string;
}) {
  const config = CALLOUT_CONFIG[kind];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-[17px] border px-3.5 py-3.5 sm:px-4',
        config.containerClassName
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px]',
            config.iconClassName
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-[11px] font-bold tracking-[0.11em] uppercase',
              config.labelClassName
            )}
          >
            {config.label}
          </p>

          <p className="mt-1.5 text-[13.5px] leading-6 text-slate-700">
            {renderInlineMarkdown(content)}
          </p>

          {renderPageReference(pageReference, itemKey)}
        </div>
      </div>
    </div>
  );
}

/**
 * Renderiza contenido pedagógico estructurado del material de estudio.
 *
 * La generación sigue siendo responsabilidad del pipeline canónico.
 * Este componente sólo interpreta la presentación: headings Markdown,
 * negritas, listas, tablas, bloques pedagógicos y referencias físicas al PDF.
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
    const bodyRows = rows
      .slice(1)
      .filter((row) =>
        row.columns.some((column) => !/^:?-+:?$/i.test(column))
      );

    if (header.length === 0 || bodyRows.length === 0) {
      rows.length = 0;
      return;
    }

    content.push(
      <div
        key={key}
        className="overflow-x-auto rounded-[17px] border border-slate-200 bg-white"
      >
        <table className="min-w-full border-collapse text-left text-[13px]">
          <thead className="bg-slate-50/90 text-slate-700">
            <tr>
              {header.map((column, index) => (
                <th
                  key={`${column}-${index}`}
                  className="border-b border-slate-200 px-3.5 py-2.5 font-semibold text-slate-900"
                >
                  {renderInlineMarkdown(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rowIndex) => (
              <tr
                key={`${row.columns.join('|')}-${rowIndex}`}
                className="odd:bg-white even:bg-slate-50/45"
              >
                {row.columns.map((column, columnIndex) => (
                  <td
                    key={`${column}-${columnIndex}`}
                    className="border-t border-slate-100 px-3.5 py-2.5 align-top leading-5 text-slate-600"
                  >
                    {renderInlineMarkdown(column)}
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

  lines.forEach((rawLine, index) => {
    if (rawLine.includes('|')) {
      isCollectingTable = true;
      rows.push({
        columns: rawLine
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

    const { text: line, pageReference } = extractPageReference(rawLine);
    const itemKey = `content-${index}`;

    if (!line && pageReference) {
      content.push(renderPageReference(pageReference, itemKey));
      return;
    }

    const markdownHeading = line.match(/^(#{1,6})\s+(.+)$/u);
    if (markdownHeading) {
      const level = markdownHeading[1]?.length ?? 3;
      const headingText = markdownHeading[2]?.trim() ?? '';

      content.push(
        <div key={itemKey} className={level <= 2 ? 'pt-2' : 'pt-1'}>
          {level <= 2 ? (
            <h4 className="text-[1rem] font-bold tracking-[-0.025em] text-slate-950 sm:text-[1.04rem]">
              {renderInlineMarkdown(headingText)}
            </h4>
          ) : (
            <h5 className="text-[0.93rem] font-semibold tracking-[-0.015em] text-slate-900">
              {renderInlineMarkdown(headingText)}
            </h5>
          )}
          {renderPageReference(pageReference, itemKey)}
        </div>
      );
      return;
    }

    if (/^\d+\.\d+(?:\.\d+)?\s+/.test(line)) {
      content.push(
        <div key={itemKey} className="pt-1">
          <h5 className="text-[0.95rem] font-bold tracking-[-0.02em] text-slate-950">
            {renderInlineMarkdown(line)}
          </h5>
          {renderPageReference(pageReference, itemKey)}
        </div>
      );
      return;
    }

    const orderedListItem = line.match(/^(\d+)\.\s+(.+)$/u);
    if (orderedListItem) {
      const itemNumber = orderedListItem[1] ?? '';
      const itemText = orderedListItem[2]?.trim() ?? '';

      content.push(
        <div key={itemKey} className="flex items-start gap-3 py-0.5">
          <span className="mt-0.5 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] px-1.5 text-[11px] font-bold text-[#2563EB]">
            {itemNumber}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] leading-6 text-slate-700">
              {renderInlineMarkdown(itemText)}
            </p>
            {renderPageReference(pageReference, itemKey)}
          </div>
        </div>
      );
      return;
    }

    if (/^(?:[\u2022\-*])\s+/.test(line)) {
      const bulletText = line.replace(/^(?:[\u2022\-*])\s+/, '').trim();

      content.push(
        <div key={itemKey} className="flex items-start gap-2.5">
          <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] leading-6 text-slate-700">
              {renderInlineMarkdown(bulletText)}
            </p>
            {renderPageReference(pageReference, itemKey)}
          </div>
        </div>
      );
      return;
    }

    const callout = getCallout(line);
    if (callout) {
      content.push(
        <StudyCallout
          key={itemKey}
          kind={callout.kind}
          content={callout.content}
          pageReference={pageReference}
          itemKey={itemKey}
        />
      );
      return;
    }

    content.push(
      <div key={itemKey} className="py-0.5">
        <p className="text-[13.5px] leading-6 text-slate-700">
          {renderInlineMarkdown(line)}
        </p>
        {renderPageReference(pageReference, itemKey)}
      </div>
    );
  });

  if (isCollectingTable) {
    flushTable('table-final');
  }

  return <div className="space-y-3.5">{content}</div>;
}
) && token.endsWith('

function getCallout(line: string): {
  kind: StudyCalloutKind;
  content: string;
} | null {
  const definitions: Array<{
    kind: StudyCalloutKind;
    pattern: RegExp;
  }> = [
    { kind: 'important', pattern: /^Importante:\s*/iu },
    { kind: 'study-tip', pattern: /^Clave de estudio:\s*/iu },
    { kind: 'example', pattern: /^Ejemplo aplicado:\s*/iu },
    { kind: 'definition', pattern: /^(?:Definición|Concepto clave):\s*/iu },
    { kind: 'classification', pattern: /^(?:Clasificación|Tipos):\s*/iu },
    { kind: 'process', pattern: /^(?:Proceso|Etapas|Pasos):\s*/iu },
    { kind: 'formula', pattern: /^Fórmula:\s*/iu },
    {
      kind: 'confusion',
      pattern: /^(?:Confusión frecuente|Error frecuente):\s*/iu,
    },
  ];

  for (const definition of definitions) {
    if (!definition.pattern.test(line)) continue;

    return {
      kind: definition.kind,
      content: line.replace(definition.pattern, '').trim(),
    };
  }

  return null;
}

function renderPageReference(pageReference: string | null, key: string) {
  if (!pageReference) return null;

  return (
    <div key={`${key}-reference`} className="pt-1">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
        <FileText className="h-3 w-3 text-[#2563EB]" />
        {pageReference}
      </span>
    </div>
  );
}

function StudyCallout({
  kind,
  content,
  pageReference,
  itemKey,
}: {
  kind: StudyCalloutKind;
  content: string;
  pageReference: string | null;
  itemKey: string;
}) {
  const config = CALLOUT_CONFIG[kind];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-[17px] border px-3.5 py-3.5 sm:px-4',
        config.containerClassName
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px]',
            config.iconClassName
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-[11px] font-bold tracking-[0.11em] uppercase',
              config.labelClassName
            )}
          >
            {config.label}
          </p>

          <p className="mt-1.5 text-[13.5px] leading-6 text-slate-700">
            {renderInlineMarkdown(content)}
          </p>

          {renderPageReference(pageReference, itemKey)}
        </div>
      </div>
    </div>
  );
}

/**
 * Renderiza contenido pedagógico estructurado del material de estudio.
 *
 * La generación sigue siendo responsabilidad del pipeline canónico.
 * Este componente sólo interpreta la presentación: headings Markdown,
 * negritas, listas, tablas, bloques pedagógicos y referencias físicas al PDF.
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
    const bodyRows = rows
      .slice(1)
      .filter((row) =>
        row.columns.some((column) => !/^:?-+:?$/i.test(column))
      );

    if (header.length === 0 || bodyRows.length === 0) {
      rows.length = 0;
      return;
    }

    content.push(
      <div
        key={key}
        className="overflow-x-auto rounded-[17px] border border-slate-200 bg-white"
      >
        <table className="min-w-full border-collapse text-left text-[13px]">
          <thead className="bg-slate-50/90 text-slate-700">
            <tr>
              {header.map((column, index) => (
                <th
                  key={`${column}-${index}`}
                  className="border-b border-slate-200 px-3.5 py-2.5 font-semibold text-slate-900"
                >
                  {renderInlineMarkdown(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rowIndex) => (
              <tr
                key={`${row.columns.join('|')}-${rowIndex}`}
                className="odd:bg-white even:bg-slate-50/45"
              >
                {row.columns.map((column, columnIndex) => (
                  <td
                    key={`${column}-${columnIndex}`}
                    className="border-t border-slate-100 px-3.5 py-2.5 align-top leading-5 text-slate-600"
                  >
                    {renderInlineMarkdown(column)}
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

  lines.forEach((rawLine, index) => {
    if (rawLine.includes('|')) {
      isCollectingTable = true;
      rows.push({
        columns: rawLine
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

    const { text: line, pageReference } = extractPageReference(rawLine);
    const itemKey = `content-${index}`;

    if (!line && pageReference) {
      content.push(renderPageReference(pageReference, itemKey));
      return;
    }

    const markdownHeading = line.match(/^(#{1,6})\s+(.+)$/u);
    if (markdownHeading) {
      const level = markdownHeading[1]?.length ?? 3;
      const headingText = markdownHeading[2]?.trim() ?? '';

      content.push(
        <div key={itemKey} className={level <= 2 ? 'pt-2' : 'pt-1'}>
          {level <= 2 ? (
            <h4 className="text-[1rem] font-bold tracking-[-0.025em] text-slate-950 sm:text-[1.04rem]">
              {renderInlineMarkdown(headingText)}
            </h4>
          ) : (
            <h5 className="text-[0.93rem] font-semibold tracking-[-0.015em] text-slate-900">
              {renderInlineMarkdown(headingText)}
            </h5>
          )}
          {renderPageReference(pageReference, itemKey)}
        </div>
      );
      return;
    }

    if (/^\d+\.\d+(?:\.\d+)?\s+/.test(line)) {
      content.push(
        <div key={itemKey} className="pt-1">
          <h5 className="text-[0.95rem] font-bold tracking-[-0.02em] text-slate-950">
            {renderInlineMarkdown(line)}
          </h5>
          {renderPageReference(pageReference, itemKey)}
        </div>
      );
      return;
    }

    const orderedListItem = line.match(/^(\d+)\.\s+(.+)$/u);
    if (orderedListItem) {
      const itemNumber = orderedListItem[1] ?? '';
      const itemText = orderedListItem[2]?.trim() ?? '';

      content.push(
        <div key={itemKey} className="flex items-start gap-3 py-0.5">
          <span className="mt-0.5 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] px-1.5 text-[11px] font-bold text-[#2563EB]">
            {itemNumber}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] leading-6 text-slate-700">
              {renderInlineMarkdown(itemText)}
            </p>
            {renderPageReference(pageReference, itemKey)}
          </div>
        </div>
      );
      return;
    }

    if (/^(?:[\u2022\-*])\s+/.test(line)) {
      const bulletText = line.replace(/^(?:[\u2022\-*])\s+/, '').trim();

      content.push(
        <div key={itemKey} className="flex items-start gap-2.5">
          <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] leading-6 text-slate-700">
              {renderInlineMarkdown(bulletText)}
            </p>
            {renderPageReference(pageReference, itemKey)}
          </div>
        </div>
      );
      return;
    }

    const callout = getCallout(line);
    if (callout) {
      content.push(
        <StudyCallout
          key={itemKey}
          kind={callout.kind}
          content={callout.content}
          pageReference={pageReference}
          itemKey={itemKey}
        />
      );
      return;
    }

    content.push(
      <div key={itemKey} className="py-0.5">
        <p className="text-[13.5px] leading-6 text-slate-700">
          {renderInlineMarkdown(line)}
        </p>
        {renderPageReference(pageReference, itemKey)}
      </div>
    );
  });

  if (isCollectingTable) {
    flushTable('table-final');
  }

  return <div className="space-y-3.5">{content}</div>;
}
)) return token.slice(1, -1);
  if (token.startsWith('\\\\(') && token.endsWith('\\\\)')) return token.slice(2, -2);
  if (token.startsWith('\\\\[') && token.endsWith('\\\\]')) return token.slice(2, -2);
  return null;
}

function renderInlineMarkdown(value: string): ReactNode {
  const tokens = value.split(INLINE_MARKUP_PATTERN);

  return tokens.map((token, index) => {
    if (/^\*\*[^*]+\*\*$/u.test(token)) {
      return (
        <strong key={`${token}-${index}`} className="font-semibold text-slate-950">
          {token.slice(2, -2)}
        </strong>
      );
    }

    if (/^`[^`]+`$/u.test(token)) {
      return (
        <code
          key={`${token}-${index}`}
          className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.92em] font-medium text-slate-800"
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    const mathExpression = unwrapMathToken(token);
    if (mathExpression !== null) {
      const display = normalizeMathExpression(mathExpression);
      return (
        <span
          key={`${token}-${index}`}
          role="math"
          aria-label={display}
          className="mx-0.5 inline-flex max-w-full items-baseline overflow-x-auto rounded-md border border-indigo-100 bg-indigo-50/70 px-1.5 py-0.5 font-mono text-[0.94em] font-semibold text-slate-900 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {display}
        </span>
      );
    }

    return token;
  });
}

function getCallout(line: string): {
  kind: StudyCalloutKind;
  content: string;
} | null {
  const definitions: Array<{
    kind: StudyCalloutKind;
    pattern: RegExp;
  }> = [
    { kind: 'important', pattern: /^Importante:\s*/iu },
    { kind: 'study-tip', pattern: /^Clave de estudio:\s*/iu },
    { kind: 'example', pattern: /^Ejemplo aplicado:\s*/iu },
    { kind: 'definition', pattern: /^(?:Definición|Concepto clave):\s*/iu },
    { kind: 'classification', pattern: /^(?:Clasificación|Tipos):\s*/iu },
    { kind: 'process', pattern: /^(?:Proceso|Etapas|Pasos):\s*/iu },
    { kind: 'formula', pattern: /^Fórmula:\s*/iu },
    {
      kind: 'confusion',
      pattern: /^(?:Confusión frecuente|Error frecuente):\s*/iu,
    },
  ];

  for (const definition of definitions) {
    if (!definition.pattern.test(line)) continue;

    return {
      kind: definition.kind,
      content: line.replace(definition.pattern, '').trim(),
    };
  }

  return null;
}

function renderPageReference(pageReference: string | null, key: string) {
  if (!pageReference) return null;

  return (
    <div key={`${key}-reference`} className="pt-1">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
        <FileText className="h-3 w-3 text-[#2563EB]" />
        {pageReference}
      </span>
    </div>
  );
}

function StudyCallout({
  kind,
  content,
  pageReference,
  itemKey,
}: {
  kind: StudyCalloutKind;
  content: string;
  pageReference: string | null;
  itemKey: string;
}) {
  const config = CALLOUT_CONFIG[kind];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-[17px] border px-3.5 py-3.5 sm:px-4',
        config.containerClassName
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px]',
            config.iconClassName
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-[11px] font-bold tracking-[0.11em] uppercase',
              config.labelClassName
            )}
          >
            {config.label}
          </p>

          <p className="mt-1.5 text-[13.5px] leading-6 text-slate-700">
            {renderInlineMarkdown(content)}
          </p>

          {renderPageReference(pageReference, itemKey)}
        </div>
      </div>
    </div>
  );
}

/**
 * Renderiza contenido pedagógico estructurado del material de estudio.
 *
 * La generación sigue siendo responsabilidad del pipeline canónico.
 * Este componente sólo interpreta la presentación: headings Markdown,
 * negritas, listas, tablas, bloques pedagógicos y referencias físicas al PDF.
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
    const bodyRows = rows
      .slice(1)
      .filter((row) =>
        row.columns.some((column) => !/^:?-+:?$/i.test(column))
      );

    if (header.length === 0 || bodyRows.length === 0) {
      rows.length = 0;
      return;
    }

    content.push(
      <div
        key={key}
        className="overflow-x-auto rounded-[17px] border border-slate-200 bg-white"
      >
        <table className="min-w-full border-collapse text-left text-[13px]">
          <thead className="bg-slate-50/90 text-slate-700">
            <tr>
              {header.map((column, index) => (
                <th
                  key={`${column}-${index}`}
                  className="border-b border-slate-200 px-3.5 py-2.5 font-semibold text-slate-900"
                >
                  {renderInlineMarkdown(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rowIndex) => (
              <tr
                key={`${row.columns.join('|')}-${rowIndex}`}
                className="odd:bg-white even:bg-slate-50/45"
              >
                {row.columns.map((column, columnIndex) => (
                  <td
                    key={`${column}-${columnIndex}`}
                    className="border-t border-slate-100 px-3.5 py-2.5 align-top leading-5 text-slate-600"
                  >
                    {renderInlineMarkdown(column)}
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

  lines.forEach((rawLine, index) => {
    if (rawLine.includes('|')) {
      isCollectingTable = true;
      rows.push({
        columns: rawLine
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

    const { text: line, pageReference } = extractPageReference(rawLine);
    const itemKey = `content-${index}`;

    if (!line && pageReference) {
      content.push(renderPageReference(pageReference, itemKey));
      return;
    }

    const markdownHeading = line.match(/^(#{1,6})\s+(.+)$/u);
    if (markdownHeading) {
      const level = markdownHeading[1]?.length ?? 3;
      const headingText = markdownHeading[2]?.trim() ?? '';

      content.push(
        <div key={itemKey} className={level <= 2 ? 'pt-2' : 'pt-1'}>
          {level <= 2 ? (
            <h4 className="text-[1rem] font-bold tracking-[-0.025em] text-slate-950 sm:text-[1.04rem]">
              {renderInlineMarkdown(headingText)}
            </h4>
          ) : (
            <h5 className="text-[0.93rem] font-semibold tracking-[-0.015em] text-slate-900">
              {renderInlineMarkdown(headingText)}
            </h5>
          )}
          {renderPageReference(pageReference, itemKey)}
        </div>
      );
      return;
    }

    if (/^\d+\.\d+(?:\.\d+)?\s+/.test(line)) {
      content.push(
        <div key={itemKey} className="pt-1">
          <h5 className="text-[0.95rem] font-bold tracking-[-0.02em] text-slate-950">
            {renderInlineMarkdown(line)}
          </h5>
          {renderPageReference(pageReference, itemKey)}
        </div>
      );
      return;
    }

    const orderedListItem = line.match(/^(\d+)\.\s+(.+)$/u);
    if (orderedListItem) {
      const itemNumber = orderedListItem[1] ?? '';
      const itemText = orderedListItem[2]?.trim() ?? '';

      content.push(
        <div key={itemKey} className="flex items-start gap-3 py-0.5">
          <span className="mt-0.5 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] px-1.5 text-[11px] font-bold text-[#2563EB]">
            {itemNumber}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] leading-6 text-slate-700">
              {renderInlineMarkdown(itemText)}
            </p>
            {renderPageReference(pageReference, itemKey)}
          </div>
        </div>
      );
      return;
    }

    if (/^(?:[\u2022\-*])\s+/.test(line)) {
      const bulletText = line.replace(/^(?:[\u2022\-*])\s+/, '').trim();

      content.push(
        <div key={itemKey} className="flex items-start gap-2.5">
          <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] leading-6 text-slate-700">
              {renderInlineMarkdown(bulletText)}
            </p>
            {renderPageReference(pageReference, itemKey)}
          </div>
        </div>
      );
      return;
    }

    const callout = getCallout(line);
    if (callout) {
      content.push(
        <StudyCallout
          key={itemKey}
          kind={callout.kind}
          content={callout.content}
          pageReference={pageReference}
          itemKey={itemKey}
        />
      );
      return;
    }

    content.push(
      <div key={itemKey} className="py-0.5">
        <p className="text-[13.5px] leading-6 text-slate-700">
          {renderInlineMarkdown(line)}
        </p>
        {renderPageReference(pageReference, itemKey)}
      </div>
    );
  });

  if (isCollectingTable) {
    flushTable('table-final');
  }

  return <div className="space-y-3.5">{content}</div>;
}
