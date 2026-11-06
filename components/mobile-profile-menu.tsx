'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronRight, Crown, MessageSquarePlus, Settings } from 'lucide-react';
import { useState } from 'react';
import { usePremium } from '@/hooks/usePremium';
import { useAppLocale } from '@/components/i18n/app-locale-provider';
const LanguageMenuItem = dynamic(() => import('@/components/i18n/language-menu-item').then(m => m.LanguageMenuItem));
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

// Un solo estado de resaltado para todas las opciones del menú de perfil móvil.
const mobileMenuItemHighlight =
  'text-[#0F1B3D] transition-colors hover:bg-[#EEF2FF] hover:text-[#0F1B3D] focus:bg-[#EEF2FF] focus:text-[#0F1B3D] data-[highlighted]:bg-[#EEF2FF] data-[highlighted]:text-[#0F1B3D]';

type MobileProfileMenuProps = {
  initials: string;
  avatarUrl?: string;
  sourcePath: string;
};

export function MobileProfileMenu({ initials, avatarUrl, sourcePath }: MobileProfileMenuProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [weeklyPrice, setWeeklyPrice] = useState<number | null>(null);
  const { isPremium } = usePremium();
  const { messages } = useAppLocale();

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
            aria-label={messages.navigation.profileMenu}
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
          <LanguageMenuItem className={'flex min-h-11 cursor-pointer items-center rounded-lg px-3 text-[13px] ' + mobileMenuItemHighlight} />
          <DropdownMenuItem asChild className={mobileMenuItemHighlight}>
            <Link href="/configuracion" className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-[13px]">
              <Settings className="h-4 w-4" aria-hidden="true" />
              {messages.navigation.settings}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className={'flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-[13px] ' + mobileMenuItemHighlight}
            onSelect={() => setFeedbackOpen(true)}
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
            {messages.navigation.feedback}
          </DropdownMenuItem>
          {!isPremium ? (
            <DropdownMenuItem asChild className={mobileMenuItemHighlight}>
              <Link href="/dashboard/premium?source=mobile_profile_menu"
                className={'mt-1 flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 ' + mobileMenuItemHighlight}>
                <Crown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-medium">{messages.navigation.upgrade}</span>
                  <span className="block text-[10px] text-slate-500">
                    {weeklyPrice !== null
                      ? `≈ ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(weeklyPrice)} ${messages.navigation.perWeek}`
                      : messages.navigation.viewPlans}
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
