'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookText,
  BriefcaseBusiness,
  Building2,
  GraduationCap,
  HeartPulse,
  Landmark,
  Microscope,
  Search,
  Stethoscope,
} from 'lucide-react';
import { getSiglo21CareerProfile } from '@/lib/siglo21-career-profiles';

type CarreraRow = {
  id: string;
  nombre: string;
};

type CareerListClientProps = {
  initialCarreras: CarreraRow[];
  universityName?: string;
};

const CAREER_PRESETS = [
  {
    matchers: ['ingenier', 'sistemas', 'informat', 'software', 'industrial'],
    icon: Building2,
    iconColor: 'text-[#5B5CF6]',
    iconBg: 'bg-[#F1F0FF]',
    description: 'Forma parte del futuro, diseña soluciones reales.',
  },
  {
    matchers: ['medicina', 'medic'],
    icon: Stethoscope,
    iconColor: 'text-[#22C55E]',
    iconBg: 'bg-[#ECFDF3]',
    description: 'Vocación, ciencia y compromiso con la vida.',
  },
  {
    matchers: ['derecho', 'abog'],
    icon: Landmark,
    iconColor: 'text-[#6D5EF8]',
    iconBg: 'bg-[#F3F0FF]',
    description: 'Defiende la justicia, construye un mejor mañana.',
  },
  {
    matchers: ['econom', 'admin', 'cont', 'negoc'],
    icon: BriefcaseBusiness,
    iconColor: 'text-[#F59E0B]',
    iconBg: 'bg-[#FFF7E8]',
    description: 'Entiende el mundo, lidera decisiones.',
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
    description: 'Diseña espacios, transforma realidades.',
  },
  {
    matchers: ['exact', 'matemat', 'fisic', 'quim', 'biolog'],
    icon: Microscope,
    iconColor: 'text-[#2563EB]',
    iconBg: 'bg-[#EFF6FF]',
    description: 'Descubre, analiza y comprende.',
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
      description: 'Explorá una formación pensada para tu futuro profesional.',
    }
  );
}

export default function CareerListClient({
  initialCarreras,
  universityName,
}: CareerListClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const isSiglo21 = universityName?.toLowerCase().includes('siglo 21') ?? false;

  const visibleCarreras = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return initialCarreras;

    return initialCarreras.filter((carrera) => carrera.nombre.toLowerCase().includes(query));
  }, [initialCarreras, searchTerm]);

  return (
    <div className="animate-tab-panel pt-6 sm:pt-7">
      <div className="animate-surface-reveal flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="section-title leading-none text-[#10214C]">
            Todas las carreras
          </h2>
          <p className="section-copy mt-2 text-[#7C879C]">
            Explorá las carreras que ofrece esta universidad.
          </p>
        </div>
        <div className="relative w-full lg:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Buscar carrera..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 w-full rounded-full border border-[#E2E8F0] bg-white pl-10 pr-4 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 sm:h-10"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleCarreras.length > 0 ? (
          visibleCarreras.map((carrera, index) => {
            const preset = getCareerPreset(carrera.nombre);
            const Icon = preset.icon;
            const officialProfile = isSiglo21 ? getSiglo21CareerProfile(carrera.nombre) : null;
            const cardDescription = officialProfile?.description ?? preset.description;

            return (
              <Link
                key={carrera.id}
                href={`/materias?carreraId=${carrera.id}`}
                className="surface-card group animate-surface-reveal p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#CBD5E1] hover:shadow-[var(--shadow-panel)] sm:p-6"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div className="flex flex-col items-center gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${preset.iconBg}`}
                  >
                    <Icon className={`h-5 w-5 ${preset.iconColor}`} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-[1.02rem] leading-6 font-semibold tracking-[-0.035em] text-[#152A63] sm:text-[1.1rem]">
                      {carrera.nombre}
                    </h3>
                    <p className="mx-auto mt-3 max-w-[220px] text-sm leading-6 text-[#7C879C]">
                      {cardDescription}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="surface-card col-span-full border-dashed bg-[#FAFBFE] px-6 py-14 text-center shadow-none">
            <p className="text-base font-semibold tracking-[-0.03em] text-[#10214C]">
              No encontramos carreras para mostrar.
            </p>
            <p className="mt-2 text-sm text-[#7C879C]">
              Probá con otra búsqueda para ver más resultados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
