'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CreemTestResultPage() {
  const [status, setStatus] = useState('Consultando…');
  const [detail, setDetail] = useState('No se activa Premium real con pagos de prueba.');
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('attemptId') || '';
    let active = true;
    let count = 0;
    const poll = async () => {
      if (!active || ++count > 12) return;
      try {
        const r = await fetch('/api/payments/creem/status?attemptId=' + encodeURIComponent(id),
          { cache:'no-store' });
        if (!r.ok) {
          if (active) setStatus('No pudimos confirmar la prueba');
          return;
        }
        const payload = await r.json() as {status?:string;mode?:string;currency?:string;amountCents?:number};
        if (!active) return;
        if (payload.mode !== 'test' || payload.currency !== 'USD' || payload.amountCents !== 999) {
          setStatus('La prueba no coincide con el producto configurado');
          return;
        }
        setStatus(payload.status === 'paid' ? 'Pago simulado confirmado'
          : payload.status === 'failed' ? 'Intento no completado'
          : 'Esperando confirmación del webhook');
        if (payload.status === 'paid') {
          setDetail('Creem confirmó el pago de prueba y se registró en la base separada. Ningún estudiante recibió Premium real.');
        } else if (count < 12) {
          window.setTimeout(poll,2500);
        }
      } catch { if (active) setStatus('No pudimos consultar la prueba'); }
    };
    void poll();
    return () => { active = false; };
  },[]);
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 py-20 text-center">
      <p className="text-chico font-semibold uppercase tracking-etiqueta text-blue-700">Evaluo · Creem Test Mode</p>
      <h1 className="mt-4 text-destacado font-bold text-slate-950">{status}</h1>
      <p className="mt-4 text-cuerpo leading-7 text-slate-600">{detail}</p>
      <Link href="/pricing" className="mt-8 rounded-xl bg-blue-600 px-6 py-3 text-cuerpo font-semibold text-white hover:bg-blue-700">
        Volver a los planes
      </Link>
    </main>
  );
}
