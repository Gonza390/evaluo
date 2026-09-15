import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
 "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-lg)] text-sm font-semibold tracking-[-0.02em] transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
 {
 variants: {
 variant: {
 default: 'bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-white shadow-[0_10px_30px_rgba(37,99,235,0.20)] hover:opacity-95',
 destructive:
 'bg-destructive text-white shadow-[0_14px_34px_rgba(239,68,68,0.16)] hover:bg-destructive/90 focus-visible:ring-destructive/20',
 outline:
 'border border-slate-200 bg-white text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.06)] hover:bg-accent hover:text-accent-foreground',
 secondary: 'bg-white text-secondary-foreground shadow-[0_10px_24px_rgba(15,23,42,0.05)] hover:bg-white/80',
 ghost: 'hover:bg-accent hover:text-accent-foreground',
 link: 'font-semibold tracking-[-0.02em] text-[#2563EB] underline-offset-4 hover:underline',
 },
 size: {
 default: 'h-11 px-5 py-3 has-[>svg]:px-4.5',
 sm: 'h-9 rounded-[var(--radius-md)] gap-1.5 px-3.5 has-[>svg]:px-3',
 lg: 'h-12 rounded-[var(--radius-xl)] px-7 has-[>svg]:px-5.5',
 icon: 'size-11',
 'icon-sm': 'size-9 rounded-[var(--radius-md)]',
 'icon-lg': 'size-12 rounded-[var(--radius-xl)]',
 },
 },
 defaultVariants: {
 variant: 'default',
 size: 'default',
 },
 }
);

function Button({
 className,
 variant,
 size,
 asChild = false,
 loading = false,
 children,
 ...props
}: React.ComponentProps<'button'> &
 VariantProps<typeof buttonVariants> & {
 asChild?: boolean;
 loading?: boolean;
 }) {
 const Comp = asChild ? Slot : 'button';

 if (asChild) {
 return (
 <Comp
 data-slot="button"
 className={cn(buttonVariants({ variant, size, className }))}
 aria-busy={loading || undefined}
 {...props}
 >
 {children}
 </Comp>
 );
 }

 return (
 <Comp
 data-slot="button"
 className={cn(buttonVariants({ variant, size, className }))}
 disabled={props.disabled || loading}
 aria-busy={loading || undefined}
 {...props}
 >
 {loading ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" /> : null}
 {children}
 </Comp>
 );
}

export { Button, buttonVariants };