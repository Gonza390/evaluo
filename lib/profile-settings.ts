export type ResolvedProfileSettingsState = {
  nombre: string;
  pais: string;
  universidadId: string;
  carreraId: string;
};

export function resolveProfileSettingsState(input: {
  profile?: {
    nombre?: string | null;
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
    pais: String(metadata.country ?? metadata.pais ?? '').trim(),
    universidadId: String(profile?.universidad_id ?? '').trim(),
    carreraId: String(profile?.carrera_id ?? '').trim(),
  } satisfies ResolvedProfileSettingsState;
}
