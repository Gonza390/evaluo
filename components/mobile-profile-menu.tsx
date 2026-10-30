'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronRight, Crown, MessageSquarePlus, Settings } from 'lucide-react';
import { useState } from 'react';
import { usePremium } from '@/hooks/usePremium';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Keep the profile menu and feedback flow out of the global app-shell bundle.
const FeedbackDialog = dynamic(() =>
  import('@/components/FeedbackDialog').then((module) => module.FeedbackDialog)
);

type MobileProfileMenuProps = {
  initials: string;
  avatarUrl?: string;
  sourcePath: string;
};

export function MobileProfileMenu({ initials, avatarUrl, sourcePath }: MobileProfileMenuProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [weeklyPrice, setWeeklyPrice] = useState<number | null>(null);
  const { isPremium } = usePremium();

  const refreshPrice = () => {
    if (isPremium) return;
    void fetch('/api/payments/offer', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return;
        const offer = (await response.json()) as { monthlyPriceArs?: number };
        if (typeof offer.monthlyPriceArs === 'number' && Number.isFinite(offer.monthlyPriceArs) && offer.monthlyPriceArs > 0) {
          setWeeklyPrice(Math.round(offer.monthlyPriceArs * 7 / 30));
        }
      })
      .catch(() => {});
  };

  return (
    <>
      <DropdownMenu onOpenChange={(open) => { if (open) refreshPrice(); }}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-mobile-profile-menu-trigger
            aria-label="Abrir menú de perfil"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-500 text-xs font-bold text-white">
                {initials}
              </AvatarFallback>
              {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          data-mobile-profile-menu
          align="end"
          sideOffset={8}
          className="w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg md:hidden"
        >
          <DropdownMenuItem asChild>
            <Link href="/configuracion" className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-[13px]">
              <Settings className="h-4 w-4" aria-hidden="true" />
              Ajustes
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-[13px]"
            onSelect={() => setFeedbackOpen(true)}
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
            Sugerencias
          </DropdownMenuItem>
          {!isPremium ? (
            <DropdownMenuItem asChild>
              <Link href="/pricing?source=mobile_profile_menu"
                className="mt-1 flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-slate-700 focus:bg-slate-100">
                <Crown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-medium">Pasate a Premium</span>
                  <span className="block text-[10px] text-slate-500">
                    {weeklyPrice !== null
                      ? `≈ ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(weeklyPrice)} por semana · cobro mensual`
                      : 'Consultá los planes'}
                  </span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              </Link>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {feedbackOpen ? (
        <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} sourcePath={sourcePath} />
      ) : null}
    </>
  );
}
