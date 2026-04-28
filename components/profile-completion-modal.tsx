'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { updateProfile } from '@/app/actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Phone, GraduationCap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';

interface Carrera {
  id: string;
  nombre: string;
}

interface ProfileModalProps {
  userId: string;
  isOpen: boolean;
  onComplete: () => void;
  onClose?: () => void;
}

export function ProfileCompletionModal({
  userId,
  isOpen,
  onComplete,
  onClose,
}: ProfileModalProps) {
  const [whatsapp, setWhatsapp] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCarreras, setLoadingCarreras] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchCarreras() {
      try {
        const { data, error } = await supabase.from('carreras').select('id, nombre').order('nombre');
        if (error) throw error;
        setCarreras(data || []);
      } catch (err) {
        console.error('Error fetching carreras:', err);
      } finally {
        setLoadingCarreras(false);
      }
    }

    if (isOpen) {
      fetchCarreras();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsapp || !carreraId) return;

    setLoading(true);
    try {
      const result = await updateProfile(userId, { whatsapp, carrera_id: carreraId });

      if (result.success) {
        toast({
          title: 'Perfil completado',
          description: 'Ya podes empezar a estudiar con Evaluo.',
        });

        router.refresh();
        onComplete();
      } else {
        throw new Error('Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'No pudimos guardar tus datos. Por favor intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = whatsapp.length >= 8 && carreraId !== '';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose?.();
        }
      }}
    >
      <DialogContent
        className="border-none bg-white/95 shadow-2xl backdrop-blur-md sm:max-w-[425px]"
      >
        <DialogHeader className="space-y-3">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <GraduationCap className="h-6 w-6 text-emerald-600" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-slate-900">
            Hola, solo un paso mas
          </DialogTitle>
          <DialogDescription className="text-center text-base text-slate-600">
            Dejanos tu WhatsApp para enviarte nuevos pregunteros y guardar tu progreso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="font-medium text-slate-700">
              WhatsApp
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="whatsapp"
                placeholder="Ej: 3511234567"
                className="h-11 rounded-xl border-slate-200 pl-10 focus:border-emerald-500 focus:ring-emerald-500"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="carrera" className="font-medium text-slate-700">
              Tu carrera
            </Label>
            <Select onValueChange={setCarreraId} required>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500">
                <SelectValue placeholder="Selecciona tu carrera" />
              </SelectTrigger>
              <SelectContent>
                {loadingCarreras ? (
                  <div className="flex items-center justify-center p-2">
                    <Spinner size="sm" />
                  </div>
                ) : (
                  carreras.map((carrera) => (
                    <SelectItem key={carrera.id} value={carrera.id}>
                      {carrera.nombre}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none"
            disabled={!isFormValid || loading}
          >
            {loading ? <Spinner size="sm" className="mr-2" /> : null}
            Empezar a estudiar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
