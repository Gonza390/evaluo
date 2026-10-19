import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfileSettingsPreview } from '@/components/preview/profile-settings-preview';
import '@/app/configuracion/configuration-clean.css';

export const metadata: Metadata = {
  title: 'Preview · Configuración del perfil',
  robots: { index: false, follow: false },
};

export default function ProfileSettingsPreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <ProfileSettingsPreview />;
}
