import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { register } from 'node:module';

const repoRoot = process.cwd();

export async function resolve(specifier, context, nextResolve) {
  // Node executes the smoke suites directly, outside the Next.js resolver.
  // Next exposes these package subpaths as .js files, while application code
  // intentionally imports the framework-facing aliases without extensions.
  // 'server-only' es una marca de compilación Next.js; los tests smoke
  // ejecutados directamente por Node no necesitan su guard de cliente.
  if (specifier === 'server-only') {
    return { url: 'data:text/javascript,export%20%7B%7D', shortCircuit: true };
  }

  if (specifier === 'next/headers') {
    return nextResolve('next/headers.js', context);
  }

  if (specifier.startsWith('@/')) {
    const relative = specifier.slice(2);
    let candidate = join(repoRoot, relative);
    if (!existsSync(candidate)) {
      candidate = `${candidate}.ts`;
    }
    if (existsSync(candidate)) {
      return nextResolve(pathToFileURL(candidate).href, context);
    }
  }
  return nextResolve(specifier, context);
}

register(new URL('./alias-loader.mjs', import.meta.url));
