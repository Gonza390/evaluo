import assert from 'node:assert/strict';
import { accountAppLocale, parseAppLocale } from '../lib/i18n/app-locale.ts';
import { uiMessages } from '../lib/i18n/messages.ts';

assert.equal(parseAppLocale('en'), 'en');
assert.equal(parseAppLocale('es'), 'es');
assert.equal(parseAppLocale('es-AR'), null);
assert.equal(parseAppLocale('fr'), null);
assert.equal(accountAppLocale({ ui_locale: 'en' }), 'en');
assert.equal(accountAppLocale({ ui_locale: 'fr' }), null);
assert.equal(accountAppLocale(null), null);
assert.deepEqual(Object.keys(uiMessages.es), Object.keys(uiMessages.en));
for (const section of Object.keys(uiMessages.es) as Array<keyof typeof uiMessages.es>) {
  assert.deepEqual(Object.keys(uiMessages.es[section]), Object.keys(uiMessages.en[section]));
  for (const value of Object.values(uiMessages.en[section])) {
    assert.ok(value.trim().length > 0);
  }
}
console.log('[i18n] Locale validation and ES/EN dictionaries verified.');
