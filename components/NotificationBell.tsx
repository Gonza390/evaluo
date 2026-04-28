'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';

const MOTIVATIONAL_PHRASES = [
  '¿Listo para estudiar?',
  '¡Hoy es un gran día para aprender!',
  '¡Dale que vos podés!',
  '¿Repasamos un poco?',
  '¡Momento perfecto para practicar!',
  '¡Vos podés lograr lo que te propongas!',
  'Un poco de ejercicio mental nunca viene mal.',
];

export function NotificationBell() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleClick = () => {
    const randomPhrase = MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)];
    setToastMessage(randomPhrase);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="relative">
      <button onClick={handleClick} className="relative cursor-pointer bg-transparent border-0 p-0">
        <Bell className="h-5 w-5 text-[#64748B]" />
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-bold text-white">
          1
        </span>
      </button>
      {showToast && (
        <div className="absolute right-0 top-10 z-50 w-48 rounded-lg bg-[#1E293B] px-3 py-2 text-sm text-white shadow-lg animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
}