import assert from 'node:assert/strict';
import {
  splitActiveItems,
  normalizeAnnouncementTable,
  formatAnnouncementTableCell,
  normalizeAnnouncementTheme,
} from './announcementContent';

assert.deepEqual(
  normalizeAnnouncementTable(
    ['N0', 'Mövzu', 'Aparıcı', 'Tarix və saat'],
    [
      ['1', 'Tətbiqlərin performans testləri', 'Dilqəm Məmmədov', '06 May 2026\n12:00'],
      ['2', 'Rəqəmsal ekspertiza: yanaşmalar və tətbiq', 'Sabine Tağıyeva'],
      ['', '', '', ''],
    ],
  ),
  {
    headers: ['N0', 'Mövzu', 'Aparıcı', 'Tarix və saat'],
    rows: [
      ['1', 'Tətbiqlərin performans testləri', 'Dilqəm Məmmədov', '06 May 2026\n12:00'],
      ['2', 'Rəqəmsal ekspertiza: yanaşmalar və tətbiq', 'Sabine Tağıyeva', ''],
    ],
  },
);

assert.equal(normalizeAnnouncementTable([], [['']]), null);

assert.equal(formatAnnouncementTableCell('06 May 202612:00'), '06 May 2026\n12:00');
assert.equal(formatAnnouncementTableCell('15 May 2026 12:00'), '15 May 2026\n12:00');
assert.equal(formatAnnouncementTableCell('Tətbiqlərin performans testləri'), 'Tətbiqlərin performans testləri');

assert.equal(normalizeAnnouncementTheme('blue'), 'blue');
assert.equal(normalizeAnnouncementTheme('not-a-theme'), 'neutral');
assert.equal(normalizeAnnouncementTheme(undefined), 'neutral');

assert.deepEqual(splitActiveItems([
  { id: 1, active: true },
  { id: 2, active: false },
  { id: 3 },
]), {
  active: [{ id: 1, active: true }, { id: 3 }],
  archived: [{ id: 2, active: false }],
});

console.log('announcement content helpers ok');
