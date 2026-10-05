import Image from 'next/image';
import { Ellipsis, Sparkles } from 'lucide-react';

type TutorAvatarState = 'thinking' | 'answering';

// Reemplazar por las rutas locales del personaje cuando estén disponibles.
const avatarImages: Record<TutorAvatarState, string | null> = {
  thinking: null,
  answering: null,
};

export function StudyErrorTutorAvatar({
  state = 'answering',
  prominent = false,
}: {
  state?: TutorAvatarState;
  prominent?: boolean;
}) {
  const image = avatarImages[state];
  return (
    <span
      aria-hidden="true"
      data-tutor-avatar={state}
      className={`relative mt-0.5 flex shrink-0 items-center justify-center overflow-hidden rounded-full ${prominent ? 'bg-primary text-primary-foreground h-11 w-11' : 'bg-primary/7 text-primary h-10 w-10'}`}
    >
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          sizes={prominent ? '44px' : '40px'}
          className="object-contain"
        />
      ) : state === 'thinking' ? (
        <Ellipsis className="h-5 w-5 motion-safe:animate-pulse" />
      ) : (
        <Sparkles className="h-5 w-5" />
      )}
    </span>
  );
}
