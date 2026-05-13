import assert from 'node:assert/strict';
import { buildEventRegistrationUrl } from './eventRegistration';

assert.equal(
  buildEventRegistrationUrl(12, 'https://unikiosk.vercel.app/admin'),
  'https://unikiosk.vercel.app/events/12/register',
);

assert.equal(
  buildEventRegistrationUrl(12, 'http://localhost:3000/events'),
  'http://localhost:3000/events/12/register',
);

assert.equal(
  buildEventRegistrationUrl(12, 'file:///Applications/unikiosk/index.html'),
  'https://unikiosk.vercel.app/events/12/register',
);

assert.equal(
  buildEventRegistrationUrl(12, 'not a url'),
  'https://unikiosk.vercel.app/events/12/register',
);

console.log('event registration helpers ok');
