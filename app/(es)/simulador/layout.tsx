import { AppShellProviders } from '@/components/app-shell-providers';
import { ExamFocusControls } from '@/components/simulador/ExamFocusControls';
import './exam-mode.css';

export default function SimuladorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShellProviders>
      <div id="evaluo-simulator-shell" data-exam-immersive="false">
        <ExamFocusControls />
        {children}
      </div>
    </AppShellProviders>
  );
}
