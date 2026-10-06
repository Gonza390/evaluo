import Image from 'next/image';

type TutorAvatarState = 'thinking' | 'answering';

const avatarImages: Record<TutorAvatarState, string> = {
  thinking: '/evi-pensando.svg',
  answering: '/evi-avatar.svg',
};

export function StudyErrorTutorAvatar({
  state = 'answering',
  prominent = false,
}: {
  state?: TutorAvatarState;
  prominent?: boolean;
}) {
  const isThinking = state === 'thinking';
  const sizeClass = prominent ? 'h-11 w-11' : isThinking ? 'h-11 w-11' : 'h-10 w-10';

  return (
    <span
      aria-hidden="true"
      data-tutor-avatar={state}
      className={`relative mt-0.5 flex shrink-0 items-center justify-center ${sizeClass} ${
        isThinking
          ? 'overflow-visible bg-transparent'
          : 'overflow-hidden rounded-full bg-[#2F4BFF] ring-1 ring-slate-200/80'
      }`}
    >
      <Image
        src={avatarImages[state]}
        alt=""
        fill
        unoptimized
        sizes={prominent || isThinking ? '44px' : '40px'}
        className={
          isThinking
            ? 'object-contain motion-safe:animate-pulse'
            : 'object-cover'
        }
      />
    </span>
  );
}
