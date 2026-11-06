import type { Metadata } from 'next';
import { EnglishLegalDocument } from '@/components/legal/english-legal-document';
export const metadata: Metadata = { title: 'Refund Policy | Evaluo', description: "This policy explains how to request assistance or a refund for Evaluo purchases in Argentina and international purchases processed through Creem. Mandatory", alternates: {canonical: '/en/refunds'}, robots: {index: false,follow: true} };
export default function LegalPage(){ return <EnglishLegalDocument policy="refunds" />; }
