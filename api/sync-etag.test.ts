import assert from 'node:assert/strict';
import { createSyncEtag } from './sync-etag.js';

const baseData = {
  announcements: [{ id: 2, title: 'ELAN' }],
  events: [{ id: 1, title: 'Old event' }],
  settings: { sync_requested_at: 'request-a' },
};

const changedLaterData = {
  announcements: [{ id: 2, title: 'ELAN' }],
  events: [{ id: 1, title: 'Updated event' }],
  settings: { sync_requested_at: 'request-a' },
};

assert.equal(createSyncEtag(baseData), createSyncEtag(baseData));
assert.notEqual(createSyncEtag(baseData), createSyncEtag(changedLaterData));
assert.match(createSyncEtag(baseData), /^[a-f0-9]{64}$/);

console.log('sync etag helpers ok');
