import type { Metadata } from 'next';
import { EnglishLegalDocument } from '@/components/legal/english-legal-document';
export const metadata: Metadata = { title: 'Copyright Policy | Evaluo', description: "Evaluo respects third-party copyright and intellectual property rights. This policy explains user responsibilities and how copyright complaints and counter", alternates: {canonical: '/en/copyright'}, robots: {index: false,follow: true} };
export default function LegalPage(){ return <EnglishLegalDocument policy="copyright" />; }
