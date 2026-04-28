import { cn } from '@/lib/utils';

interface PdfViewerProps {
  url: string;
  title?: string;
  className?: string;
  heightClassName?: string;
}

function withPdfViewerParams(url: string) {
  const [baseUrl, hashFragment = ''] = url.split('#');
  const params = new URLSearchParams(hashFragment);

  if (!params.has('toolbar')) params.set('toolbar', '0');
  if (!params.has('navpanes')) params.set('navpanes', '0');

  return `${baseUrl}#${params.toString()}`;
}

export default function PdfViewer({
  url,
  title = 'Vista de PDF',
  className,
  heightClassName = 'h-[600px]',
}: PdfViewerProps) {
  return (
    <div className={cn('w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100', className)}>
      <iframe
        src={withPdfViewerParams(url)}
        title={title}
        className={cn('w-full', heightClassName)}
        loading="lazy"
      />
    </div>
  );
}
