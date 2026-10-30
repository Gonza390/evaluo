import { redirect } from 'next/navigation';

export default function SimulatorFeedbackAdminPage() {
  redirect('/administrador/feedback?view=simuladores');
}
