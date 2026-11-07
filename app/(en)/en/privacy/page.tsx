import type { Metadata } from 'next';
import { EnglishLegalDocument } from '@/components/legal/english-legal-document';
export const metadata: Metadata = { title: 'Privacy Policy | Evaluo', description: "Evaluo collects and processes information needed to operate your study account, provide AI-assisted learning features, protect the platform and improve its", alternates: {canonical: '/en/privacy'}, robots: {index: false,follow: true} };
export default function LegalPage(){ return <EnglishLegalDocument policy="privacy" />; }
