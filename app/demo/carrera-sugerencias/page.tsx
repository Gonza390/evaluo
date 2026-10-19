import { CareerDuplicateSuggestionsDemo } from '@/components/demo/career-duplicate-suggestions-demo';

const demoUniversities = [
  {
    id: 'demo-uba',
    nombre: 'Universidad de Buenos Aires',
    aliases: ['UBA', 'U.B.A.', 'Universidad Buenos Aires'],
  },
  {
    id: 'demo-siglo21',
    nombre: 'Universidad Siglo 21',
    aliases: ['Siglo 21', 'Siglo XXI', 'UES21'],
  },
];

const demoCareers = [
  {
    id: 'demo-uba-medicina',
    nombre: 'Medicina',
    universidad_id: 'demo-uba',
  },
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
  return <CareerDuplicateSuggestionsDemo universities={demoUniversities} careers={demoCareers} />;
}
