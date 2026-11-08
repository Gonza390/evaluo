'use client';
import { CheckCircle2, Globe2, GraduationCap, MapPin, Phone, Save, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
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
function anioCarreraLabel(value: string, english: boolean) {
  return english ? (value === '6' ? '6th year or later' : `Year ${value}`) : (value === '6' ? '6to o más' : `${value}° año`);
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
  const english = useOptionalAppLocale() === 'en';
  const tr = (es: string,en: string) => english ? en : es;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleSave();
      }}
      className="border-border bg-card space-y-4 rounded-xl border p-3.5 sm:p-4"
      aria-label={tr("Datos de tu perfil","Your profile information")}
    >
      <h2 className="text-foreground text-cuerpo font-semibold">{tr("Datos personales","Personal information")}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="nombre" className="text-foreground text-ui font-medium">
            {tr("Nombre","Name")}
          </Label>
          <Input
            id="nombre"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder={tr("Tu nombre completo","Your full name")}
            className="border-input bg-card h-11 rounded-lg text-cuerpo md:text-ui"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-foreground text-ui font-medium">
            {tr("Correo electrónico","Email address")}
          </Label>
          <Input
            id="email"
            value={email}
            readOnly
            disabled
            className="border-input bg-card text-muted-foreground h-11 rounded-lg text-cuerpo disabled:opacity-100 md:text-ui"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Globe2 className="text-brand h-4 w-4" />
          <h2 className="text-foreground text-cuerpo font-semibold">{tr("Contacto","Contact details")}</h2>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pais" className="text-foreground text-ui font-medium">
              {tr("País","Country")}
            </Label>
            <div className="relative">
              <MapPin className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="pais"
                value={pais}
                onChange={(event) => setPais(event.target.value)}
                placeholder={tr("Ej: Argentina","e.g. Argentina")}
                className="border-input bg-card h-11 rounded-lg pl-10 text-cuerpo md:text-ui"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telefono" className="text-foreground text-ui font-medium">
              {tr("Teléfono","Phone")} <span className="text-muted-foreground font-normal">{tr("(opcional)","(optional)")}</span>
            </Label>
            <div className="relative">
              <Phone className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(event) => setTelefono(event.target.value)}
                placeholder={english ? 'e.g. +1 555 0100' : 'Ej: +54 9 11 1234 5678'}
                className="border-input bg-card h-11 rounded-lg pl-10 text-cuerpo md:text-ui"
              />
            </div>
          </div>
        </div>
      </div>

      <section
        className="border-border space-y-3 border-t pt-4"
        aria-labelledby="academic-settings-title"
      >
        <h2 id="academic-settings-title" className="text-foreground text-cuerpo font-semibold">
          {tr("Tu formación","Your education")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="universidad-search" className="text-foreground text-ui font-medium">
              {tr("Universidad","University")}
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
                placeholder={tr("Buscá tu universidad","Search for your university")}
                className="border-input bg-card h-11 rounded-lg pl-10 text-cuerpo md:text-ui"
              />
            </div>
            {!universidadId ? (
              <div className="border-border bg-card max-h-48 overflow-y-auto overscroll-contain rounded-lg border">
                {loadingUniversidades ? (
                  <div className="flex items-center justify-center p-4">
                    <Spinner size="sm" />
                  </div>
                ) : universidades.length === 0 ? (
                  <div className="text-muted-foreground px-4 py-4 text-cuerpo">
                    {hasLoadedUniversidades
                      ? tr("No encontramos esa universidad.","University not found.")
                      : tr("Escribí al menos 2 letras para buscar tu universidad.","Enter at least two letters to search.")}
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
                      className={`hover:bg-primary/5 flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-ui transition ${
                        universidadId === universidad.id
                          ? 'bg-primary/5 text-primary'
                          : 'text-foreground'
                      }`}
                    >
                      <span>{universidad.nombre}</span>
                      {universidadId === universidad.id ? (
                        <span className="inline-flex items-center gap-1 text-chico font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {tr("Seleccionada","Selected")}
                        </span>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="carrera-search" className="text-foreground text-ui font-medium">
              {tr("Carrera","Degree program")}
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
                    ? (english ? `Search for your degree program at ${universidadSeleccionada.nombre}` : `Buscá tu carrera en ${universidadSeleccionada.nombre}`)
                    : tr("Primero seleccioná una universidad","Select a university first")
                }
                className="border-input bg-card h-11 rounded-lg pl-10 text-cuerpo disabled:opacity-60 md:text-ui"
              />
            </div>
            {universidadId && !carreraId ? (
              <div className="border-border bg-card max-h-48 overflow-y-auto overscroll-contain rounded-lg border">
                {loadingCarreras ? (
                  <div className="flex items-center justify-center p-4">
                    <Spinner size="sm" />
                  </div>
                ) : !universidadId ? (
                  <div className="text-muted-foreground px-4 py-4 text-cuerpo">
                    {tr("Primero seleccioná una universidad.","Select a university first.")}
                  </div>
                ) : carrerasFiltradas.length === 0 ? (
                  <div className="text-muted-foreground px-4 py-4 text-cuerpo">
                    {tr("No encontramos carreras para esa búsqueda.","No degree programs match that search.")}
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
                      className={`hover:bg-primary/5 flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-ui transition ${
                        carreraId === carrera.id ? 'bg-primary/5 text-primary' : 'text-foreground'
                      }`}
                    >
                      <span>{carrera.nombre}</span>
                      {carreraId === carrera.id ? (
                        <span className="inline-flex items-center gap-1 text-chico font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {tr("Seleccionada","Selected")}
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
        <Label htmlFor="anio-carrera" className="text-foreground text-ui font-medium">
          {tr("Año de carrera que cursás","Current year of your degree program")}{" "}
          <span className="text-muted-foreground font-normal">{tr("(opcional)","(optional)")}</span>
        </Label>
        <Select value={anioCarrera || undefined} onValueChange={setAnioCarrera}>
          <SelectTrigger
            id="anio-carrera"
            className="border-input bg-card h-11 w-full rounded-lg text-cuerpo md:text-ui"
          >
            <SelectValue placeholder={tr("Seleccioná tu año","Select your year")} />
          </SelectTrigger>
          <SelectContent>
            {ANIOS_CARRERA.map((value) => (
              <SelectItem key={value} value={value}>
                {anioCarreraLabel(value,english)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="border-border flex flex-col gap-3 border-t pt-4 sm:flex-row-reverse sm:items-center sm:justify-between">
        <Button
          type="submit"
          disabled={!canSave || saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full rounded-lg text-ui font-semibold sm:w-auto"
        >
          {saving ? (
            <>
              <Spinner size="sm" className="mr-2" />
              {tr("Guardando cambios","Saving changes")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {tr("Guardar cambios","Save changes")}
            </>
          )}
        </Button>
        <p className="text-muted-foreground text-chico leading-5">
          {tr("Podés guardar un solo cambio sin completar el resto del perfil.","You can save a single change without filling out the rest of the profile.")}
        </p>
      </div>
    </form>
  );
}
