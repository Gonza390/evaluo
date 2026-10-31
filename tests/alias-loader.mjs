import { fileURLToPath, pathToFileURL } from 'node:url';
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

  // Native node --experimental-strip-types does not resolve extensionless
  // relative TypeScript imports. Next.js and tsc do; mirror that for smoke tests.
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    const target = new URL(specifier, context.parentURL);
    if (!/\.(?:[cm]?js|tsx?)$/.test(target.pathname)) {
      const candidatePath = fileURLToPath(target);
      for (const ext of ['.ts', '.tsx', '.mjs', '.js']) {
        if (existsSync(candidatePath + ext)) {
          return nextResolve(pathToFileURL(candidatePath + ext).href, context);
        }
      }
    }
  }

  if (specifier.startsWith('@/')) {
    const relative = specifier.slice(2);
    const candidates = [relative];
    // The browser-facing app routes live under two root layout groups.
    // API routes and shared modules remain at their original app/ paths.
    if (relative.startsWith('app/') && !relative.startsWith('app/(')) {
      const rest = relative.slice('app/'.length);
      candidates.push('app/' + (rest.startsWith('en/') || rest === 'en' ? '(en)/' : '(es)/') + rest);
    }
    for (const path of candidates) {
      for (const extension of ['', '.ts', '.tsx', '.mjs', '.js']) {
        const candidate = join(repoRoot, path + extension);
        if (existsSync(candidate)) {
          return nextResolve(pathToFileURL(candidate).href, context);
        }
      }
    }
  }
  return nextResolve(specifier, context);
}

register(new URL('./alias-loader.mjs', import.meta.url));
