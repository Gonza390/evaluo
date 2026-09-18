import type { Metadata } from 'next';
import { SimulatorExamActivationFlowPreview } from '@/components/simulador/SimulatorExamActivationFlowPreview';

export const metadata: Metadata = {
  title: 'Preview · Flujo Preguntero a PDF',
  robots: { index: false, follow: false },
};

export default function SimulatorExamActivationPreviewPage() {
  return <SimulatorExamActivationFlowPreview />;
}
