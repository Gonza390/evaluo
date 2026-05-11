import { getMateriasByCarrera, getCarreraById, getUniversidadById } from '@/services/api-server';
import type { Materia } from '@/services/api-server';
import MateriaList from '@/components/materia-list';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function MateriasPage({
  searchParams,
}: {
  searchParams: Promise<{ carreraId?: string }>;
}) {
  const resolvedParams = await searchParams;
  const carreraId = resolvedParams.carreraId;

  if (!carreraId) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Materias</CardTitle>
          </CardHeader>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4 text-lg">
              Selecciona una carrera desde el buscador para ver sus materias
            </p>
            <Button variant="outline" asChild>
              <Link href="/">← Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  let materias: Materia[] = [];
  let carreraData: Awaited<ReturnType<typeof getCarreraById>> | null = null;
  let universidadData: Awaited<ReturnType<typeof getUniversidadById>> | null = null;

  try {
    carreraData = await getCarreraById(carreraId);
    materias = await getMateriasByCarrera(carreraId);

    if (carreraData?.universidad_id) {
      universidadData = await getUniversidadById(carreraData.universidad_id);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Error cargando materias: {message}</p>
            <Button variant="outline" asChild>
              <Link href="/">← Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <MateriaList
      initialMaterias={materias}
      carreraId={carreraId}
      carreraNombre={carreraData?.nombre}
      carreraData={carreraData}
      universidadNombre={universidadData?.nombre}
      universidadId={universidadData?.id}
    />
  );
}
