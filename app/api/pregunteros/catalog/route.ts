import { NextResponse } from 'next/server';
import { loadPregunteroHubData } from '@/app/pregunteros/data';

export const revalidate = 600;

export async function GET() {
  const carreras = await loadPregunteroHubData();

  return NextResponse.json(carreras, {
    headers: {
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
    },
  });
}
