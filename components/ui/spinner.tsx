import { cn } from '@/lib/utils';

interface SpinnerProps extends React.ComponentProps<'div'> {
  size?: 'sm' | 'md' | 'lg';
}

function Spinner({ className, size = 'md', ...props }: SpinnerProps) {
  const sizeClass =
    size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6';

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'relative inline-flex items-center justify-center text-[#4F5DFF]',
        sizeClass,
        className
      )}
      {...props}
    >
      <span className="absolute inset-0 rounded-full border border-[#CBD5FF]/70" />
      <span className="absolute inset-[16%] rounded-full border-2 border-transparent border-t-[#4F5DFF] border-r-[#4F5DFF]/70 animate-[spin_1.1s_linear_infinite]" />
      <span className="h-[22%] w-[22%] rounded-full bg-[#4F5DFF]/80 shadow-[0_0_18px_rgba(79,93,255,0.35)]" />
    </div>
  );
}

export { Spinner };
