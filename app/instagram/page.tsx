import { redirect } from 'next/navigation';

export default function InstagramRedirectPage() {
  redirect(
    '/login?mode=signup&utm_source=instagram&utm_medium=social&utm_campaign=perfil_instagram&utm_content=bio_link'
  );
}
