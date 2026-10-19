'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays } from 'lucide-react';

export function ProductDatePicker({
  value,
  max,
  label,
  isToday,
}: {
  value: string;
  max: string;
  label: string;
  isToday: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const changeDate = (nextDate: string) => {
    if (!nextDate) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('panel', 'producto');
    params.set('productDate', nextDate);
    router.push(`/administrador?${params.toString()}`);
  };

  return (
    <label className="admin-date-picker">
      <span className="admin-date-picker-label">
        <CalendarDays aria-hidden="true" />
        {isToday ? 'Hoy' : label}
      </span>
      <input
        type="date"
        value={value}
        max={max}
        onChange={(event) => changeDate(event.target.value)}
        aria-label="Elegir fecha del resumen de Producto"
      />
    </label>
  );
}
