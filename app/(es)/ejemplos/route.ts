// These retired public SEO pages are gone; Google can drop them from its index.
export function GET() { return new Response(null, { status: 410 }); }
export function HEAD() { return new Response(null, { status: 410 }); }
