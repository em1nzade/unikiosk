import assert from 'node:assert/strict';
import { cleanRegistrationText, validateRegistrationInput } from './event-registration-utils';

assert.equal(cleanRegistrationText('  Aysel Məmmədova  ', 100), 'Aysel Məmmədova');
assert.equal(cleanRegistrationText('   ', 100), null);
assert.equal(cleanRegistrationText(42, 100), null);
assert.equal(cleanRegistrationText('abcdef', 3), 'abc');

assert.deepEqual(validateRegistrationInput({ event_id: 4, full_name: 'Aysel Məmmədova', group_name: 'TT-23' }), {
  eventId: 4,
  fullName: 'Aysel Məmmədova',
  groupName: 'TT-23',
});

assert.throws(
  () => validateRegistrationInput({ event_id: 4, full_name: 'A', group_name: 'TT-23' }),
  /Ad Soyad/,
);

assert.throws(
  () => validateRegistrationInput({ event_id: 4, full_name: 'Aysel Məmmədova', group_name: '' }),
  /Qrup/,
);

console.log('event registration api helpers ok');
