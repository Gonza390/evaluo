import { AppShellProviders } from '@/components/app-shell-providers';

export default function SimuladorLayout({ children }: { children: React.ReactNode }) {
  return <AppShellProviders>{children}</AppShellProviders>;
}
