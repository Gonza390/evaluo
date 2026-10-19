import { permanentRedirect } from 'next/navigation';

export default function RedditRedirectPage() {
  permanentRedirect(
    '/?utm_source=reddit&utm_medium=community&utm_campaign=reddit&utm_content=shortlink'
  );
}
