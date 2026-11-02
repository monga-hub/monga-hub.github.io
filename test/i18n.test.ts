import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authMessage, lang, STRINGS } from '../src/i18n.ts';

test('English is the default language', () => {
  assert.equal(lang, 'en');
});

// Every key of one language exists in the other, with the same kind of value.
function shape(o: Record<string, unknown>): unknown {
  return Object.fromEntries(Object.entries(o).sort().map(([k, v]) =>
    [k, v && typeof v === 'object' ? shape(v as Record<string, unknown>) : typeof v]));
}
test('Italian has exactly the English strings', () => {
  assert.deepEqual(shape(STRINGS.it), shape(STRINGS.en));
});

test('Supabase auth errors map to readable text in both languages', () => {
  assert.equal(authMessage({ code: 'invalid_credentials' }, STRINGS.en), 'Wrong email or password.');
  assert.equal(authMessage({ code: 'invalid_credentials' }, STRINGS.it), 'Email o password non corretti.');
  assert.equal(authMessage({ code: 'user_already_exists' }, STRINGS.en), STRINGS.en.errors.email_exists);
  assert.equal(authMessage({ code: 'over_request_rate_limit' }, STRINGS.it), STRINGS.it.errors.rate_limit);
  assert.equal(authMessage({ code: 'something_new', message: 'Raw message' }, STRINGS.en), 'Raw message');
  assert.equal(authMessage({}, STRINGS.it), STRINGS.it.errors.generic);
});
