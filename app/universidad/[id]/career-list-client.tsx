'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, BookText, BriefcaseBusiness, GraduationCap, HeartPulse, Landmark, Microscope, Search, Stethoscope } from 'lucide-react';

type CarreraRow = {
  id: string;
  nombre: string;
};

type CareerListClientProps = {
  initialCarreras: CarreraRow[];
  materiaCountEntries: Array<[string, number]>;
};

const CAREER_PRESETS = [
  {
    matchers: ['ingenier', 'sistemas', 'informat', 'software', 'industrial'],
    icon: Building2,
    iconColor: 'text-[#5B5CF6]',
    iconBg: 'bg-[#F1F0FF]',
    description: 'Forma parte del futuro, disena soluciones reales.',
  },
  {
    matchers: ['medicina', 'medic'],
    icon: Stethoscope,
    iconColor: 'text-[#22C55E]',
    iconBg: 'bg-[#ECFDF3]',
    description: 'Vocacion, ciencia y compromiso con la vida.',
  },
  {
    matchers: ['derecho', 'abog'],
    icon: Landmark,
    iconColor: 'text-[#6D5EF8]',
    iconBg: 'bg-[#F3F0FF]',
    description: 'Defende la justicia, construi un mejor manana.',
  },
  {
    matchers: ['econom', 'admin', 'cont', 'negoc'],
    icon: BriefcaseBusiness,
    iconColor: 'text-[#F59E0B]',
    iconBg: 'bg-[#FFF7E8]',
    description: 'Entende el mundo, lidera decisiones.',
  },
  {
    matchers: ['psic'],
    icon: HeartPulse,
    iconColor: 'text-[#F43F8E]',
    iconBg: 'bg-[#FFF0F6]',
    description: 'Mente, comportamiento y bienestar.',
  },
  {
    matchers: ['arquitect', 'urban'],
    icon: Building2,
    iconColor: 'text-[#3B82F6]',
    iconBg: 'bg-[#EEF5FF]',
    description: 'Disena espacios, transforma realidades.',
  },
  {
    matchers: ['exact', 'matemat', 'fisic', 'quim', 'biolog'],
    icon: Microscope,
    iconColor: 'text-[#2563EB]',
    iconBg: 'bg-[#EFF6FF]',
    description: 'Descubri, analiza y comprende.',
  },
  {
    matchers: ['social', 'comunic', 'period'],
    icon: BookText,
    iconColor: 'text-[#FB7185]',
    iconBg: 'bg-[#FFF1F2]',
    description: 'Comunica, informa y genera impacto.',
  },
];

function getCareerPreset(name: string) {
  const normalizedName = name.toLowerCase();

  return (
    CAREER_PRESETS.find(({ matchers }) =>
      matchers.some((matcher) => normalizedName.includes(matcher))
    ) ?? {
      icon: GraduationCap,
      iconColor: 'text-[#5B5CF6]',
      iconBg: 'bg-[#F1F0FF]',
      description: 'Explora una formacion pensada para tu futuro profesional.',
    }
  );
}

export default function CareerListClient({
  initialCarreras,
  materiaCountEntries,
}: CareerListClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const materiaCountByCarrera = useMemo(() => new Map(materiaCountEntries), [materiaCountEntries]);

  const visibleCarreras = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return initialCarreras;

    return initialCarreras.filter((carrera) => carrera.nombre.toLowerCase().includes(query));
  }, [initialCarreras, searchTerm]);

  return (
    <div className="pt-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-[28px] leading-none font-bold tracking-[-0.05em] text-[#10214C]">
            Todas las carreras
          </h2>
          <p className="mt-2 text-sm text-[#7C879C]">
            Explora las carreras que ofrece esta universidad.
          </p>
        </div>
        <div className="relative w-full lg:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Buscar carrera..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full rounded-full border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-4 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#4F5DFF] focus:outline-none focus:ring-2 focus:ring-[#4F5DFF]/20"
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleCarreras.length > 0 ? (
          visibleCarreras.map((carrera) => {
            const preset = getCareerPreset(carrera.nombre);
            const Icon = preset.icon;
            const materiasCount = materiaCountByCarrera.get(carrera.id) ?? 0;

            return (
              <Link
                key={carrera.id}
                href={`/materias?carreraId=${carrera.id}`}
                className="group rounded-2xl border border-[#E9EDF5] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#CBD5E1] hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${preset.iconBg}`}
                  >
                    <Icon className={`h-5 w-5 ${preset.iconColor}`} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-[19px] leading-6 font-semibold tracking-[-0.03em] text-[#152A63]">
                      {carrera.nombre}
                    </h3>
                    <p className="mt-3 max-w-[220px] text-sm leading-6 text-[#7C879C]">
                      {preset.description}
                    </p>
                    <span className="mt-4 inline-flex rounded-full bg-[#EEF2FF] px-2.5 py-1 text-xs font-semibold text-[#5867FF]">
                      {materiasCount} materias
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-[#D7DFEC] bg-[#FAFBFE] px-6 py-14 text-center">
            <p className="text-base font-semibold text-[#10214C]">
              No encontramos carreras para mostrar.
            </p>
            <p className="mt-2 text-sm text-[#7C879C]">
              Prueba con otra busqueda para ver mas resultados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
