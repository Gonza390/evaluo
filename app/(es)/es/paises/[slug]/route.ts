// This retired SEO route is intentionally gone. A 410 directs crawlers to
// drop the URL from their index rather than following an unrelated redirect.
export function GET() {
  return new Response(null, { status: 410 });
}

export function HEAD() {
  return new Response(null, { status: 410 });
}
