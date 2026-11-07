'use client';

import { useRouter } from 'next/navigation';
import { FreeUploadLimitScreen } from '@/components/dashboard/free-upload-limit-screen';
import { nextFreeUploadAt } from '@/lib/free-study-v2';
import { premiumUpgradeForLimit } from '@/lib/premium-flow';

export function FreeUploadLimitDemo() {
  const router = useRouter();
  return <FreeUploadLimitScreen
    fileName="Marketing II - Unidad 3.pdf"
    fileSizeBytes={2_516_582}
    premiumHref={premiumUpgradeForLimit('material_upload').href}
    nextAvailableAt={nextFreeUploadAt()}
    onBack={() => router.push('/dashboard')}
  />;
}
