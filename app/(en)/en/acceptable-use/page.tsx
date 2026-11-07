import type { Metadata } from 'next';
import { EnglishLegalDocument } from '@/components/legal/english-legal-document';
export const metadata: Metadata = { title: 'Acceptable Use Policy | Evaluo', description: "Evaluo is designed to help you learn from your own study materials, not to distribute unauthorized content, facilitate cheating or disrupt other users.", alternates: {canonical: '/en/acceptable-use'}, robots: {index: false,follow: true} };
export default function LegalPage(){ return <EnglishLegalDocument policy="acceptable-use" />; }
