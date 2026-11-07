import type { Metadata } from 'next';
import { EnglishLegalDocument } from '@/components/legal/english-legal-document';
export const metadata: Metadata = { title: 'Terms of Service | Evaluo', description: "These Terms govern your use of Evaluo, including uploading study materials, generating AI-assisted learning content, and subscribing to Premium. By using t", alternates: {canonical: '/en/terms'}, robots: {index: false,follow: true} };
export default function LegalPage(){ return <EnglishLegalDocument policy="terms" />; }
