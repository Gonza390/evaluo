import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { register } from 'node:module';

const repoRoot = process.cwd();

export async function resolve(specifier, context, nextResolve) {
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
