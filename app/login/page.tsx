import LoginFormGoogleFirst from '@/components/LoginFormGoogleFirst';

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#F8FBFF_0%,#F4F7FC_45%,#FFFFFF_100%)] px-4 py-6 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-100/55 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-80px] h-80 w-80 rounded-full bg-indigo-100/45 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[520px] items-center justify-center sm:min-h-[calc(100vh-5rem)]">
        <div className="w-full rounded-[28px] border border-slate-200/90 bg-white/95 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.09)] backdrop-blur sm:p-7">
          <LoginFormGoogleFirst />
        </div>
      </div>
    </main>
  );
}
