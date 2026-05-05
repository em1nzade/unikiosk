import assert from 'node:assert/strict';
import { buildFeedbackUrl } from './feedback';

assert.equal(buildFeedbackUrl('https://kiosk.example.edu'), 'https://oyu-feedback.vercel.app/');
assert.equal(buildFeedbackUrl('https://kiosk.example.edu/admin'), 'https://oyu-feedback.vercel.app/');
assert.equal(buildFeedbackUrl('http://localhost:3000/some/path?x=1'), 'https://oyu-feedback.vercel.app/');
assert.equal(buildFeedbackUrl('file:///Applications/unikiosk/index.html'), 'https://oyu-feedback.vercel.app/');

console.log('feedback helpers ok');
