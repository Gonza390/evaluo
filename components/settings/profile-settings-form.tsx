'use client';
import { CheckCircle2, Globe2, GraduationCap, MapPin, Phone, Save, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = {
  nombre: string;
  pais: string;
  telefono: string;
  anioCarrera: string;
  universidadId: string;
  carreraId: string;
  universidadSearch: string;
  carreraSearch: string;
  setNombre: (value: string) => void;
  setPais: (value: string) => void;
  setTelefono: (value: string) => void;
  setAnioCarrera: (value: string) => void;
  setUniversidadId: (value: string) => void;
  setCarreraId: (value: string) => void;
  setUniversidadSearch: (value: string) => void;
  setCarreraSearch: (value: string) => void;
  email: string;
  universidades: Array<{ id: string; nombre: string }>;
  carrerasFiltradas: Array<{ id: string; nombre: string }>;
  universidadSeleccionada: { nombre: string } | null;
  loadingUniversidades: boolean;
  loadingCarreras: boolean;
  hasLoadedUniversidades: boolean;
  canSave: boolean;
  saving: boolean;
  handleSave: () => void | Promise<void>;
};
const ANIOS_CARRERA = ['1', '2', '3', '4', '5', '6'] as const;
function anioCarreraLabel(value: string) {
  return value === '6' ? '6to o más' : `${value}° año`;
}
export function ProfileSettingsForm({
  nombre,
  pais,
  telefono,
  anioCarrera,
  universidadId,
  carreraId,
  universidadSearch,
  carreraSearch,
  setNombre,
  setPais,
  setTelefono,
  setAnioCarrera,
  setUniversidadId,
  setCarreraId,
  setUniversidadSearch,
  setCarreraSearch,
  email,
  universidades,
  carrerasFiltradas,
  universidadSeleccionada,
  loadingUniversidades,
  loadingCarreras,
  hasLoadedUniversidades,
  canSave,
  saving,
  handleSave,
}: Props) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSave();
      }}
      className="border-border bg-card space-y-4 rounded-xl border p-3.5 sm:p-4"
      aria-label="Datos de tu perfil"
    >
      <h2 className="text-foreground text-[15px] font-semibold">Datos personales</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="nombre" className="text-foreground text-[13px] font-medium">
            Nombre
          </Label>
          <Input
            id="nombre"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Tu nombre completo"
            className="border-input bg-card h-11 rounded-lg text-base md:text-[13px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-foreground text-[13px] font-medium">
            Correo electrónico
          </Label>
          <Input
            id="email"
            value={email}
            readOnly
            disabled
            className="border-input bg-card text-muted-foreground h-11 rounded-lg text-base disabled:opacity-100 md:text-[13px]"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Globe2 className="text-brand h-4 w-4" />
          <h2 className="text-foreground text-sm font-bold">Contacto</h2>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pais" className="text-foreground text-[13px] font-medium">
              País
            </Label>
            <div className="relative">
              <MapPin className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="pais"
                value={pais}
                onChange={(event) => setPais(event.target.value)}
                placeholder="Ej: Argentina"
                className="border-input bg-card h-11 rounded-lg pl-10 text-base md:text-[13px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telefono" className="text-foreground text-[13px] font-medium">
              Teléfono <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <div className="relative">
              <Phone className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(event) => setTelefono(event.target.value)}
                placeholder="Ej: +54 9 11 1234 5678"
                className="border-input bg-card h-11 rounded-lg pl-10 text-base md:text-[13px]"
              />
            </div>
          </div>
        </div>
      </div>

      <section
        className="border-border space-y-3 border-t pt-4"
        aria-labelledby="academic-settings-title"
      >
        <h2 id="academic-settings-title" className="text-foreground text-[15px] font-semibold">
          Tu formación
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="universidad-search" className="text-foreground text-[13px] font-medium">
              Universidad
            </Label>
            <div className="relative">
              <School className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="universidad-search"
                value={universidadSearch}
                onChange={(event) => {
                  setUniversidadSearch(event.target.value);
                  setUniversidadId('');
                  setCarreraId('');
                  setCarreraSearch('');
                }}
                placeholder="Buscá tu universidad"
                className="border-input bg-card h-11 rounded-lg pl-10 text-base md:text-[13px]"
              />
            </div>
            {!universidadId ? (
              <div className="border-border bg-card max-h-48 overflow-y-auto overscroll-contain rounded-lg border">
                {loadingUniversidades ? (
                  <div className="flex items-center justify-center p-4">
                    <Spinner size="sm" />
                  </div>
                ) : universidades.length === 0 ? (
                  <div className="text-muted-foreground px-4 py-4 text-sm">
                    {hasLoadedUniversidades
                      ? 'No encontramos esa universidad.'
                      : 'Escribí al menos 2 letras para buscar tu universidad.'}
                  </div>
                ) : (
                  universidades.map((universidad) => (
                    <button
                      key={universidad.id}
                      type="button"
                      onClick={() => {
                        setUniversidadId(universidad.id);
                        setUniversidadSearch(universidad.nombre);
                        setCarreraId('');
                        setCarreraSearch('');
                      }}
                      className={`hover:bg-primary/5 flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[13px] transition ${
                        universidadId === universidad.id
                          ? 'bg-primary/5 text-primary'
                          : 'text-foreground'
                      }`}
                    >
                      <span>{universidad.nombre}</span>
                      {universidadId === universidad.id ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Seleccionada
                        </span>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="carrera-search" className="text-foreground text-[13px] font-medium">
              Carrera
            </Label>
            <div className="relative">
              <GraduationCap className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="carrera-search"
                value={carreraSearch}
                onChange={(event) => {
                  setCarreraSearch(event.target.value);
                  setCarreraId('');
                }}
                disabled={!universidadId}
                placeholder={
                  universidadSeleccionada
                    ? `Buscá tu carrera en ${universidadSeleccionada.nombre}`
                    : 'Primero seleccioná una universidad'
                }
                className="border-input bg-card h-11 rounded-lg pl-10 text-base disabled:opacity-60 md:text-[13px]"
              />
            </div>
            {universidadId && !carreraId ? (
              <div className="border-border bg-card max-h-48 overflow-y-auto overscroll-contain rounded-lg border">
                {loadingCarreras ? (
                  <div className="flex items-center justify-center p-4">
                    <Spinner size="sm" />
                  </div>
                ) : !universidadId ? (
                  <div className="text-muted-foreground px-4 py-4 text-sm">
                    Primero seleccioná una universidad.
                  </div>
                ) : carrerasFiltradas.length === 0 ? (
                  <div className="text-muted-foreground px-4 py-4 text-sm">
                    No encontramos carreras para esa búsqueda.
                  </div>
                ) : (
                  carrerasFiltradas.map((carrera) => (
                    <button
                      key={carrera.id}
                      type="button"
                      onClick={() => {
                        setCarreraId(carrera.id);
                        setCarreraSearch(carrera.nombre);
                      }}
                      className={`hover:bg-primary/5 flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[13px] transition ${
                        carreraId === carrera.id ? 'bg-primary/5 text-primary' : 'text-foreground'
                      }`}
                    >
                      <span>{carrera.nombre}</span>
                      {carreraId === carrera.id ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Seleccionada
                        </span>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </div>
      </section>
      <div className="space-y-1.5 sm:max-w-xs">
        <Label htmlFor="anio-carrera" className="text-foreground text-[13px] font-medium">
          Año de carrera que cursás{' '}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Select value={anioCarrera || undefined} onValueChange={setAnioCarrera}>
          <SelectTrigger
            id="anio-carrera"
            className="border-input bg-card h-11 w-full rounded-lg text-base md:text-[13px]"
          >
            <SelectValue placeholder="Seleccioná tu año" />
          </SelectTrigger>
          <SelectContent>
            {ANIOS_CARRERA.map((value) => (
              <SelectItem key={value} value={value}>
                {anioCarreraLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="border-border flex flex-col gap-3 border-t pt-4 sm:flex-row-reverse sm:items-center sm:justify-between">
        <Button
          type="submit"
          disabled={!canSave || saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full rounded-lg text-[13px] font-semibold sm:w-auto"
        >
          {saving ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Guardando cambios
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar cambios
            </>
          )}
        </Button>
        <p className="text-muted-foreground text-xs leading-5">
          Podés guardar un solo cambio sin completar el resto del perfil.
        </p>
      </div>
    </form>
  );
}
