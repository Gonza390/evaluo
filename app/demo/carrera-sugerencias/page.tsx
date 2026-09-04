import { CareerDuplicateSuggestionsDemo } from '@/components/demo/career-duplicate-suggestions-demo';

const demoCareers = [
  {
    id: 'demo-abogacia',
    nombre: 'Abogacía',
    universidad_id: 'demo-siglo21',
  },
  {
    id: 'demo-martillero',
    nombre: 'Martillero, Corredor Público y Corredor Inmobiliario',
    universidad_id: 'demo-siglo21',
  },
  {
    id: 'demo-administracion',
    nombre: 'Lic. en Administración',
    universidad_id: 'demo-siglo21',
  },
  {
    id: 'demo-marketing',
    nombre: 'Licenciatura en Comercialización – Marketing',
    universidad_id: 'demo-siglo21',
  },
  {
    id: 'demo-psicologia',
    nombre: 'Licenciatura en Psicología',
    universidad_id: 'demo-siglo21',
  },
];

export default function CareerDuplicateSuggestionsDemoPage() {
  return (
    <CareerDuplicateSuggestionsDemo
      universityName="Universidad Siglo 21"
      careers={demoCareers}
    />
  );
}
