export type ResolvedProfileSettingsState = {
  nombre: string;
  pais: string;
  telefono: string;
  anioCarrera: string;
  universidadId: string;
  carreraId: string;
};

export function resolveProfileSettingsState(input: {
  profile?: {
    nombre?: string | null;
    pais?: string | null;
    telefono?: string | null;
    anio_carrera?: string | null;
    universidad_id?: string | null;
    carrera_id?: string | null;
  } | null;
  userMetadata?: Record<string, unknown> | null;
  fallbackName: string;
}) {
  const profile = input.profile ?? null;
  const metadata = input.userMetadata ?? {};

  return {
    nombre:
      String(profile?.nombre ?? '').trim() ||
      String(metadata.full_name ?? metadata.name ?? '').trim() ||
      input.fallbackName,
    pais:
      String(profile?.pais ?? '').trim() ||
      String(metadata.country ?? metadata.pais ?? '').trim(),
    telefono: String(profile?.telefono ?? '').trim(),
    anioCarrera: String(profile?.anio_carrera ?? '').trim(),
    universidadId: String(profile?.universidad_id ?? '').trim(),
    carreraId: String(profile?.carrera_id ?? '').trim(),
  } satisfies ResolvedProfileSettingsState;
}
