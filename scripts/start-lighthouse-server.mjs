import { spawn } from 'node:child_process';

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const MATERIAS_PATH =
  '/materias?carreraId=5f53394d-4f86-4d81-a8de-b88dc08b3e38';

const server = spawn('npm', ['start'], {
  env: process.env,
  stdio: 'inherit',
});

let shuttingDown = false;

function stop(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  server.kill(signal);
}

process.on('SIGTERM', () => stop('SIGTERM'));
process.on('SIGINT', () => stop('SIGINT'));

server.on('exit', (code, signal) => {
  if (!shuttingDown && code !== 0) {
    process.exitCode = code ?? 1;
  }
  if (signal) process.kill(process.pid, signal);
});

async function fetchFully(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: { 'user-agent': 'evaluo-lighthouse-warmup' },
  });
  if (!response.ok) {
    throw new Error(`Warmup failed for ${url}: HTTP ${response.status}`);
  }
  await response.arrayBuffer();
}

async function waitUntilReady() {
  const deadline = Date.now() + 120_000;
  let lastError;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Next server exited before warmup (code ${server.exitCode}).`);
    }

    try {
      await fetchFully(`${BASE_URL}/`);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw lastError ?? new Error('Timed out waiting for Next server.');
}

try {
  await waitUntilReady();

  // /materias depende de catálogo remoto + caché de Next. Lighthouse debe medir
  // el render estable, no la primera carga de datos de un proceso recién iniciado.
  await fetchFully(`${BASE_URL}${MATERIAS_PATH}`);

  console.log('LHCI_WARM_READY');
} catch (error) {
  console.error(error);
  stop('SIGTERM');
  process.exitCode = 1;
}
