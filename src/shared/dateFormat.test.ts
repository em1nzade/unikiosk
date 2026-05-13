import assert from 'node:assert/strict';
import { formatDisplayDate, toDateInputValue } from './dateFormat';

assert.equal(toDateInputValue('2026-05-07T00:00:00.000Z'), '2026-05-07');
assert.equal(toDateInputValue('2026-05-07'), '2026-05-07');
assert.equal(toDateInputValue(''), '');

assert.equal(formatDisplayDate('2026-05-07T00:00:00.000Z'), '7 may 2026');
assert.equal(formatDisplayDate('2026-12-01'), '1 dekabr 2026');
assert.equal(formatDisplayDate('not-a-date'), 'not-a-date');

console.log('date format helpers ok');
