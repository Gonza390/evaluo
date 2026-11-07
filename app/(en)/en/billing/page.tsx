import type { Metadata } from 'next';
import { EnglishLegalDocument } from '@/components/legal/english-legal-document';
export const metadata: Metadata = { title: 'Billing Terms | Evaluo', description: "These Billing Terms explain subscriptions, recurring charges, payments, cancellation and refunds for Evaluo paid plans, together with the Terms of Service,", alternates: {canonical: '/en/billing'}, robots: {index: false,follow: true} };
export default function LegalPage(){ return <EnglishLegalDocument policy="billing" />; }
