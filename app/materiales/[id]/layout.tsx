import type { Metadata } from 'next';
import ClientLayout from '@/components/ClientLayout';
import { StudentMaterialAuthor } from '@/components/student-material-author';
import { parseSeoEntitySlug } from '@/lib/seo-intents';
import './material-study.css';

export const metadata: Metadata = {
  title: 'Material de estudio',
  description: 'Lector interno para PDFs subidos por estudiantes en Evaluo.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function StudentMaterialLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const materialId = parseSeoEntitySlug(id).id;

  return (
    <ClientLayout>
      <div className="material-study-editorial">
        <StudentMaterialAuthor materialId={materialId} />
        {children}
      </div>
    </ClientLayout>
  );
}
