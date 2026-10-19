'use client';

import { useState } from 'react';
import { ProfileSettingsForm } from '@/components/settings/profile-settings-form';

const universities = [
  { id: 'siglo21', nombre: 'Universidad Siglo 21' },
  { id: 'uba', nombre: 'Universidad de Buenos Aires' },
];
const careers = [
  { id: 'abogacia', nombre: 'Abogacía' },
  { id: 'publicidad', nombre: 'Licenciatura en Publicidad' },
];

export function ProfileSettingsPreview() {
  const [nombre, setNombre] = useState('Estudiante de ejemplo');
  const [pais, setPais] = useState('Argentina');
  const [telefono, setTelefono] = useState('');
  const [anioCarrera, setAnioCarrera] = useState('2');
  const [universidadId, setUniversidadId] = useState('siglo21');
  const [carreraId, setCarreraId] = useState('publicidad');
  const [universidadSearch, setUniversidadSearch] = useState('Universidad Siglo 21');
  const [carreraSearch, setCarreraSearch] = useState('Licenciatura en Publicidad');
  const [saved, setSaved] = useState(false);
  const current = JSON.stringify({ nombre, pais, telefono, anioCarrera, universidadId, carreraId });
  const [initial, setInitial] = useState(current);

  return (
    <div className="configuration-editorial bg-background min-h-dvh px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <p className="text-muted-foreground text-xs">
          Vista de prueba · Datos de ejemplo · No modifica tu cuenta
        </p>
        <header className="space-y-1">
          <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
            Configuración
          </h1>
          <p className="text-muted-foreground text-[13px] leading-5">
            Actualizá tus datos personales y académicos.
          </p>
        </header>
        <ProfileSettingsForm
          nombre={nombre}
          setNombre={setNombre}
          pais={pais}
          setPais={setPais}
          telefono={telefono}
          setTelefono={setTelefono}
          anioCarrera={anioCarrera}
          setAnioCarrera={setAnioCarrera}
          universidadId={universidadId}
          setUniversidadId={setUniversidadId}
          carreraId={carreraId}
          setCarreraId={setCarreraId}
          universidadSearch={universidadSearch}
          setUniversidadSearch={setUniversidadSearch}
          carreraSearch={carreraSearch}
          setCarreraSearch={setCarreraSearch}
          email="estudiante@example.com"
          universidades={universities.filter((item) =>
            item.nombre.toLowerCase().includes(universidadSearch.toLowerCase())
          )}
          carrerasFiltradas={careers.filter((item) =>
            item.nombre.toLowerCase().includes(carreraSearch.toLowerCase())
          )}
          universidadSeleccionada={universities.find((item) => item.id === universidadId) ?? null}
          loadingUniversidades={false}
          loadingCarreras={false}
          hasLoadedUniversidades
          canSave={
            current !== initial &&
            nombre.trim().length >= 2 &&
            pais.trim().length >= 2 &&
            (!universidadSearch.trim() || Boolean(universidadId)) &&
            (!carreraSearch.trim() || Boolean(carreraId))
          }
          saving={false}
          handleSave={() => {
            setInitial(current);
            setSaved(true);
          }}
        />
        {saved && (
          <p role="status" className="text-primary text-[13px]">
            Cambios guardados solo en esta vista de prueba.
          </p>
        )}
      </div>
    </div>
  );
}
