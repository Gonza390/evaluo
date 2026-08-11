import { BookOpen, SearchCheck } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface ElegantLoaderProps {
  variant?: 'global' | 'component';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function ElegantLoader({
  variant = 'component',
  size = 'md',
  text = 'Analizando material de estudio...',
  className = '',
}: ElegantLoaderProps) {
  const Icon = variant === 'global' ? BookOpen : SearchCheck;
  const iconSize = size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-16 h-16';

  return (
    <div className={`flex flex-col items-center gap-4 p-8 ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(79,93,255,0.14),transparent_68%)] blur-xl" />
        <Spinner size={size} className="absolute" />
        <Icon
          className={`${iconSize} relative z-10 animate-[loaderFloat_2.6s_ease-in-out_infinite] stroke-slate-500 stroke-[1.8] group-[.global]:stroke-indigo-600`}
        />
      </div>
      <p className="text-sm leading-relaxed font-medium tracking-[0.01em] text-slate-500">{text}</p>
    </div>
  );
}
