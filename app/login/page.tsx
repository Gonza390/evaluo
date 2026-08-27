import LoginFormGoogleFirst from '@/components/LoginFormGoogleFirst';
import './login-clean.css';

export default function LoginPage() {
  return (
    <main className="login-editorial min-h-screen bg-white px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[520px] items-center justify-center sm:min-h-[calc(100vh-5rem)]">
        <div className="w-full border-y border-slate-200 py-5 sm:py-7">
          <LoginFormGoogleFirst />
        </div>
      </div>
    </main>
  );
}
