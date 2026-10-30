import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyMateriaPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    } else if (value != null) {
      query.set(key, value);
    }
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : '';
  redirect(`/explorar/materia/${encodeURIComponent(id)}${suffix}`);
}
