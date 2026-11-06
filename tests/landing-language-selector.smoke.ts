import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const selector = readFileSync('components/marketing/landing-language-selector.tsx', 'utf8');
const home = readFileSync('components/marketing/home-redesign.tsx', 'utf8');
const english = readFileSync('components/marketing/english-study-page.tsx', 'utf8');
const appLocale = readFileSync('lib/i18n/app-locale.ts', 'utf8');

assert.match(selector, /data-landing-language-selector/);
assert.match(selector, /<details/);
assert.match(selector, /<summary/);
assert.match(selector, /Globe2/);
assert.match(selector, /aria-current=\{locale === option\.locale \? 'page'/);
assert.match(selector, /window\.localStorage\.setItem\(APP_LOCALE_STORAGE_KEY, next\)/);
assert.match(selector, /locale: 'es', label: 'Español',[^\n]+href: '\/'/);
assert.match(selector, /locale: 'en', label: 'English',[^\n]+href: '\/en'/);
assert.ok(selector.indexOf("locale: 'es'") < selector.indexOf("locale: 'en'"), 'Spanish should be first in menu');
assert.match(home, /<LandingLanguageSelector locale="es" \/>/);
assert.match(english, /<LandingLanguageSelector locale="en" \/>/);
assert.match(appLocale, /APP_LOCALE_STORAGE_KEY/);
console.log('[landing-i18n] ES/EN selector, order, routes, persistence and both headers verified.');
