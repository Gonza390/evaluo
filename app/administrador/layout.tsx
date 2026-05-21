import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Administrador',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdministradorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
