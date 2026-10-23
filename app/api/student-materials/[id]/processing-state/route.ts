import { NextResponse } from 'next/server';
import { getStudentMaterialProcessingStateAction } from '@/app/dashboard/materiales/actions';

// Consultar progreso es una operación idempotente de lectura. Exponerla como
// GET evita el protocolo de Server Actions, que ante respuestas interrumpidas
// producía "An unexpected response was received from the server".
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const state = await getStudentMaterialProcessingStateAction(id);
  return NextResponse.json(
    { state },
    {
      status: state ? 200 : 404,
      headers: { 'Cache-Control': 'private, no-store' },
    }
  );
}
