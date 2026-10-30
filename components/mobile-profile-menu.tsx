'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { MessageSquarePlus, Settings } from 'lucide-react';
import { useState } from 'react';
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

  return (
    <>
      <DropdownMenu>
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
          className="w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg md:hidden"
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
        </DropdownMenuContent>
      </DropdownMenu>
      {feedbackOpen ? (
        <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} sourcePath={sourcePath} />
      ) : null}
    </>
  );
}
