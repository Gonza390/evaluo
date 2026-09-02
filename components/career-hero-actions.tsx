'use client';

import { Share2, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { buildShareReferralUrl } from '@/lib/attribution';
import { supabase } from '@/lib/supabase-client';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/components/ui/use-toast';
import { logError } from '@/lib/observability';

export function CareerHeroActions({ carreraId, carreraNombre }: { carreraId: string; carreraNombre: string }) {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.id) {
        if (active) setIsFavorite(false);
        return;
      }
      const { data } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('carrera_id', carreraId)
        .maybeSingle();
      if (active) setIsFavorite(Boolean(data));
    }
    void load();
    return () => {
      active = false;
    };
  }, [carreraId, user?.id]);

  const toggleFavorite = async () => {
    if (loading) return;
    if (!user?.id) {
      toast({
        title: 'Iniciá sesión para guardar favoritos',
        description: 'Te llevamos al login para guardar esta carrera.',
      });
      router.push(`/login?next=${encodeURIComponent(`/materias?carreraId=${carreraId}`)}&reason=save-career`);
      return;
    }

    const next = !isFavorite;
    setIsFavorite(next);
    setLoading(true);
    try {
      if (next) {
        const { error } = await supabase.from('user_favorites').insert({ user_id: user.id, carrera_id: carreraId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('carrera_id', carreraId);
        if (error) throw error;
      }
    } catch (error) {
      setIsFavorite(!next);
      logError('careerHero.toggleFavorite', error, { carreraId, userId: user.id });
    } finally {
      setLoading(false);
    }
  };

  const share = async () => {
    const basePath = `/materias?carreraId=${encodeURIComponent(carreraId)}`;
    const shareUrl = user?.id
      ? buildShareReferralUrl(basePath, user.id).replace('resultado_simulador', 'carrera')
      : new URL(basePath, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: carreraNombre, text: `Mirá esta carrera en Evaluo: ${carreraNombre}`, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Link copiado', description: 'Ya podés compartir esta carrera.' });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Link copiado', description: 'Ya podés compartir esta carrera.' });
      } catch {
        toast({ title: 'No pudimos compartir la carrera', variant: 'destructive' });
      }
    }
  };

  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
      <button
        type="button"
        onClick={() => void share()}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/15 sm:px-5"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Compartir carrera</span>
        <span className="sm:hidden">Compartir</span>
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => void toggleFavorite()}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/15 disabled:opacity-60 sm:px-5"
      >
        <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        <span className="hidden sm:inline">{isFavorite ? 'Carrera guardada' : 'Guardar carrera'}</span>
        <span className="sm:hidden">{isFavorite ? 'Guardada' : 'Guardar'}</span>
      </button>
    </div>
  );
}
