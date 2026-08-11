import Image from 'next/image';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,#f7faff_0%,#eef4ff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1080px] items-center justify-center">
        <div className="grid w-full max-w-[980px] overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] lg:grid-cols-[0.88fr_1.12fr]">
          <LoginForm />

          <section className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.22),transparent_16%),radial-gradient(circle_at_78%_30%,rgba(129,140,248,0.22),transparent_20%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.12),transparent_22%),linear-gradient(160deg,#050B2C_0%,#0F1B3D_100%)] lg:block">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10)_0%,transparent_30%,transparent_68%,rgba(255,255,255,0.08)_100%)]" />
            <div className="absolute left-[14%] top-[18%] h-28 w-28 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute right-[12%] top-[16%] h-16 w-16 rotate-12 rounded-2xl border border-white/12 bg-white/6 backdrop-blur-sm" />
            <div className="absolute right-[20%] top-[40%] h-10 w-10 -rotate-12 rounded-xl border border-white/12 bg-white/6 backdrop-blur-sm" />
            <div className="absolute left-[58%] top-[64%] h-3 w-3 rounded-full bg-white/30" />
            <div className="absolute inset-y-10 left-10 w-px bg-white/12" />
            <div className="absolute left-10 right-10 top-10 h-px bg-white/12" />
            <div className="absolute left-[36%] top-[30%] animate-loginFloat rounded-2xl border border-white/18 bg-white/14 px-4 py-3 text-white shadow-[0_20px_34px_rgba(15,23,42,0.16)] backdrop-blur-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
                Simuladores
              </p>
            </div>
            <div className="absolute right-[12%] top-[16%] animate-loginFloat rounded-2xl border border-white/18 bg-white/14 px-4 py-3 text-white shadow-[0_20px_34px_rgba(15,23,42,0.16)] backdrop-blur-md" style={{ animationDelay: '220ms' }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
                Resúmenes
              </p>
            </div>
            <div className="relative flex h-full min-h-[640px] items-end justify-center px-8 pb-0 pt-10">
              <Image
                src="/imagentarjetadashboard.webp"
                alt="Estudiante usando Evaluo"
                width={980}
                height={980}
                priority
                className="h-auto w-[86%] max-w-[650px] object-contain object-bottom"
                sizes="(max-width: 1024px) 0px, 50vw"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
