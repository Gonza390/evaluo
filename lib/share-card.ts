export type ShareCardKind = 'materia' | 'preguntero' | 'material';

function cleanShareCardValue(value: string | null | undefined, maxLength: number) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function buildShareCardPath(input: {
  kind: ShareCardKind;
  title: string;
  subtitle?: string | null;
  detail?: string | null;
}) {
  const params = new URLSearchParams({
    kind: input.kind,
    title: cleanShareCardValue(input.title, 92) || 'Evaluo',
  });

  const subtitle = cleanShareCardValue(input.subtitle, 120);
  const detail = cleanShareCardValue(input.detail, 90);

  if (subtitle) params.set('subtitle', subtitle);
  if (detail) params.set('detail', detail);

  return `/api/share-card?${params.toString()}`;
}
