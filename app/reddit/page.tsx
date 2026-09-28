import { redirect } from 'next/navigation';

export default function RedditRedirectPage() {
  redirect(
    '/?utm_source=reddit&utm_medium=community&utm_campaign=reddit&utm_content=shortlink'
  );
}
