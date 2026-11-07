'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useUser } from '@/hooks/useUser';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { parseAccountTimeZone } from '@/lib/i18n/account-time-zone';

export function TimeZonePreference() {
  const { user } = useUser();
  const english = useOptionalAppLocale() === 'en';
  const saved = parseAccountTimeZone(user?.user_metadata?.time_zone);
  const [deviceZone, setDeviceZone] = useState<string | null>(null);
  const [choice, setChoice] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const zones = useMemo(() => {
    const list = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
    return [...new Set([...list, ...(deviceZone ? [deviceZone] : []), ...(saved ? [saved] : [])])].sort();
  }, [deviceZone, saved]);

  useEffect(() => {
    const detected = parseAccountTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setDeviceZone(detected);
  }, []);
  useEffect(() => { setChoice(saved ?? deviceZone ?? ''); }, [user?.id, saved, deviceZone]);


  async function saveZone(value: string) {
    setChoice(value);
    if (!user || !parseAccountTimeZone(value) || saved === value) return;
    setSaving(true);
    setMessage('');
    const {error} = await supabase.auth.updateUser({data: {time_zone: value}});
    setMessage(error
      ? (english ? 'Could not save your time zone. Please try again.' : 'No pudimos guardar tu zona horaria. Reintentá.')
      : (english ? 'Time zone saved.' : 'Zona horaria guardada.'));
    setSaving(false);
  }
  if (!user) return null;
  return <div className="border-b border-slate-100 py-3 text-sm">
    <label htmlFor="exam-time-zone" className="block font-medium text-slate-800">{english ? 'Time zone for exam reminders' : 'Zona horaria para recordatorios de examen'}</label>
    <p className="mt-1 text-xs text-slate-500">{english ? 'We use your local date for exam reminders. Your uploaded materials and billing are unchanged.' : 'Usamos tu fecha local para los recordatorios. Tus materiales y cobros no cambian.'}</p>
    <select id="exam-time-zone" className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800" value={choice} disabled={saving || !zones.length} onChange={event => void saveZone(event.target.value)}>
      {!choice && <option value="">{english ? 'Detecting time zone…' : 'Detectando zona horaria…'}</option>}
      {zones.map(zone=><option key={zone} value={zone}>{zone}{zone === deviceZone ? (english ? ' (current device)' : ' (dispositivo actual)') : ''}</option>)}
    </select>
    {message && <p role="status" className="mt-1 text-xs text-slate-500">{message}</p>}
  </div>;
}
