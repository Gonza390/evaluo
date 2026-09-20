const secret = process.env.CRON_SECRET?.trim() || process.env.INTERNAL_QUEUE_SECRET?.trim();

if (!secret) {
  console.error('manual_sender_test: missing internal queue secret');
  process.exit(1);
}

const response = await fetch('https://evaluo.com.ar/api/internal/manual-exam-3d-test', {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${secret}`,
    Accept: 'application/json',
  },
  signal: AbortSignal.timeout(20_000),
});

const body = await response.text();
console.log(`manual_sender_test: HTTP ${response.status} ${body}`);

if (!response.ok) {
  process.exit(1);
}
