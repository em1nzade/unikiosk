import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { neon } from '@neondatabase/serverless';
import XLSX from 'xlsx';

const ROOT = process.cwd();
const FALLBACK_JSON = '/Users/barbie/Documents/New project 4/sorgular/outputs/kiosk-schedule-all-times.json';
const EXCEL_DIR = path.join(ROOT, 'exceller');
const PDF_ROWS_JSON = path.join(ROOT, 'scripts', 'pdf-schedule-rows.json');
const NATURE_DOCX_ROWS_JSON = path.join(ROOT, 'scripts', 'nature-docx-schedule-rows.json');

const FACULTIES = [
  { key: 'humanitar', name: 'Humanitar, təhsil və dillər fakültəsi', aliases: ['Humanitar, təhsil və dillər'] },
  { key: 'nature', name: 'Təbiət və Texnologiyalar Fakültəsi', aliases: ['Təbiət və texnologiyalar'] },
  { key: 'economics', name: 'İqtisadiyyat və İdarəetmə Fakültəsi', aliases: ['İqtisadiyyat və idarəetmə'] },
  { key: 'english', name: 'İngilis dilində tədrisin təşkili fakültəsi', aliases: ['İngilis dilində tədrisin təşkili'] },
];

const DAY_INDEX = new Map([['I', 1], ['II', 2], ['III', 3], ['IV', 4], ['V', 5]]);
const SLOT_INDEX = new Map([
  ['08:00-09:20', 1],
  ['09:35-10:55', 2],
  ['11:10-12:30', 3],
  ['12:45-14:05', 4],
  ['14:20-15:40', 5],
  ['15:55-17:15', 6],
]);
const TIME_NORMALIZE = new Map([
  ['800-920', '08:00-09:20'],
  ['0800-0920', '08:00-09:20'],
  ['08:00-09:20', '08:00-09:20'],
  ['0935-1055', '09:35-10:55'],
  ['09:35-10:55', '09:35-10:55'],
  ['1110-1230', '11:10-12:30'],
  ['11:10-12:30', '11:10-12:30'],
  ['1245-1405', '12:45-14:05'],
  ['12:45-14:05', '12:45-14:05'],
  ['1420-1540', '14:20-15:40'],
  ['14:20-15:40', '14:20-15:40'],
  ['1555-1715', '15:55-17:15'],
  ['15:55-17:15', '15:55-17:15'],
]);

function clean(value) {
  return String(value ?? '').replace(/_x000D_/g, '\n').replace(/_x000C_/g, '\f').replace(/\r/g, '\n').trim();
}

function oneLine(value) {
  return clean(value).replace(/\s+/g, ' ').trim();
}

function canonicalFacultyName(value) {
  const normalized = oneLine(value).replace(/\s+fakültəsi$/i, '').toLocaleLowerCase('az');
  for (const faculty of FACULTIES) {
    const names = [faculty.name, ...faculty.aliases].map(name => name.replace(/\s+fakültəsi$/i, '').toLocaleLowerCase('az'));
    if (names.includes(normalized)) return faculty.name;
  }
  return oneLine(value);
}

function normalizeDay(value) {
  const day = oneLine(value).toLocaleUpperCase('az');
  return DAY_INDEX.has(day) ? day : '';
}

function normalizeTime(value) {
  const match = oneLine(value).replace(/[–—]/g, '-').match(/(?:0?8(?:00)?-0?9(?:20)?|08:00-09:20|0935-1055|09:35-10:55|1110-1230|11:10-12:30|1245-1405|12:45-14:05|1420-1540|14:20-15:40|1555-1715|15:55-17:15)/);
  if (!match) return '';
  const compact = match[0].replace(/\s+/g, '').replace(/^8/, '800').replace(/^8000/, '0800');
  return TIME_NORMALIZE.get(compact) || TIME_NORMALIZE.get(match[0]) || '';
}

function inferSector(group, faculty) {
  const code = oneLine(group).toLocaleUpperCase('az');
  const fac = oneLine(faculty).toLocaleLowerCase('az');
  if (fac.includes('ingilis') || code.includes('İF') || /(^|[^A-ZƏÖÜĞÇŞİ])X\d*$/u.test(code)) return 'en';
  if (code.includes('RUS') || /\dR/u.test(code) || /^R/u.test(code)) return 'ru';
  return 'az';
}

function normalizeRoom(value) {
  const text = oneLine(value).replace(/^Auditoriya\s*[:\-]?\s*/i, '').replace(/^Otaq\s*[:\-]?\s*/i, '');
  const namedRoom = text.match(/\b(?:Dizayn\s*mərkəzi|Design\s*center)\s*-?\s*\d+\b/iu);
  if (namedRoom) return namedRoom[0].replace(/\s*-\s*/g, '-');
  const match = text.match(/\b\d{2,4}[A-Za-zƏÖÜĞÇŞİəöüğçşı/-]*\b/u);
  return match ? match[0] : '';
}

function normalizeGroup(value) {
  return oneLine(value).replace(/\s+/g, '');
}

function courseYearFromRoman(value) {
  const roman = oneLine(value).toLocaleUpperCase('az');
  return ({ I: 1, II: 2, III: 3, IV: 4 }[roman]) || Number(roman) || null;
}

function addRow(rows, row) {
  const faculty = canonicalFacultyName(row['Fakültə']);
  const courseYear = Number(row.Kurs);
  const day = normalizeDay(row['Gün']);
  const time = normalizeTime(row.Saat);
  const group = normalizeGroup(row.Qrup);
  const subject = oneLine(row['Fənn']);
  if (!faculty || !courseYear || !day || !time || !group || !subject) return false;
  rows.push({
    'Fakültə': faculty,
    Kurs: String(courseYear),
    Sektor: row.Sektor || inferSector(group, faculty),
    'Gün': day,
    Saat: time,
    Qrup: group,
    'Fənn': subject,
    'Müəllim': oneLine(row['Müəllim']),
    Auditoriya: normalizeRoom(row.Auditoriya),
  });
  return true;
}

function readFallbackRows() {
  if (!fs.existsSync(FALLBACK_JSON)) return [];
  const source = JSON.parse(fs.readFileSync(FALLBACK_JSON, 'utf8'));
  const rows = [];
  for (const row of source) {
    const faculty = canonicalFacultyName(row['Fakültə']);
    if (faculty === FACULTIES[0].name || faculty === FACULTIES[3].name) {
      addRow(rows, { ...row, 'Fakültə': faculty });
    }
  }
  return rows;
}

function readEconomicsSeedRows() {
  const seedPath = path.join(ROOT, 'scripts', 'seed_schedule.cjs');
  const text = fs.readFileSync(seedPath, 'utf8');
  const groupsMatch = text.match(/const groups = (\[[\s\S]*?\]);/);
  const cellsMatch = text.match(/const cells = (\{[\s\S]*?\n\});\n\n\(async/);
  if (!groupsMatch || !cellsMatch) return [];

  const context = {};
  vm.createContext(context);
  vm.runInContext(`groups = ${groupsMatch[1]}; cells = ${cellsMatch[1]};`, context);

  const rows = [];
  for (const [key, cell] of Object.entries(context.cells)) {
    const [day, slot, groupIndex] = key.split('_').map(Number);
    const group = context.groups[groupIndex];
    const dayName = [...DAY_INDEX.entries()].find(([, idx]) => idx === day)?.[0];
    const time = [...SLOT_INDEX.entries()].find(([, idx]) => idx === slot)?.[0];
    if (!group || !dayName || !time) continue;
    addRow(rows, {
      'Fakültə': FACULTIES[2].name,
      Kurs: '1',
      Sektor: 'az',
      'Gün': dayName,
      Saat: time,
      Qrup: group,
      'Fənn': cell.s,
      'Müəllim': cell.t,
      Auditoriya: cell.r,
    });
  }
  return rows;
}

function readPdfRows() {
  if (!fs.existsSync(PDF_ROWS_JSON)) return [];
  const source = JSON.parse(fs.readFileSync(PDF_ROWS_JSON, 'utf8'));
  const rows = [];
  for (const row of source) addRow(rows, row);
  return rows;
}

function readNatureDocxRows() {
  if (!fs.existsSync(NATURE_DOCX_ROWS_JSON)) return [];
  const source = JSON.parse(fs.readFileSync(NATURE_DOCX_ROWS_JSON, 'utf8'));
  const rows = [];
  for (const row of source) addRow(rows, row);
  return rows;
}

function splitGroups(value) {
  return oneLine(value)
    .replace(/\\/g, '/')
    .replace(/\bITS\b/g, 'ITS')
    .split(/[,/ ]+/)
    .map(normalizeGroup)
    .filter(group => /\d/.test(group) && /[A-ZƏÖÜĞÇŞİ]/iu.test(group) && group.length >= 3);
}

function isTeacherToken(value) {
  const text = oneLine(value);
  return /\b(prof|dos|b\\m|müəl|mu?ell|[A-ZƏÖÜĞÇŞİ]\.)/iu.test(text) && !/^Otaq/i.test(text) && !/^Auditoriya/i.test(text);
}

function isNoise(value) {
  const text = oneLine(value);
  return !text || text === 'FALSE' || /^Tələbə say/i.test(text) || /^T\?l\?b\? say/i.test(text) || /^D\?rs c\?dv\?li/i.test(text);
}

function readNatureRows() {
  const file = path.join(EXCEL_DIR, '“Təbiət-və-texnologiyalar”-1-KURS-RUS-otaqla.xlsx');
  if (!fs.existsSync(file)) return [];
  const workbook = XLSX.readFile(file, { raw: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const sourceRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  const tokens = sourceRows.flatMap(row => clean(row[0]).split('\n').map(oneLine)).filter(token => !isNoise(token));
  const rows = [];
  let day = '';
  let time = '';
  let subject = '';
  let pendingGroups = [];
  let lastRows = [];

  for (const token of tokens) {
    const dayCandidate = normalizeDay(token);
    const timeCandidate = normalizeTime(token);
    const afterTime = token.replace(/.*?(?:800-920|0800-0920|0935-1055|1110-1230|1245-1405|1420-1540|1555-1715|08:00-09:20|09:35-10:55|11:10-12:30|12:45-14:05|14:20-15:40|15:55-17:15)/, '').trim();

    if (dayCandidate) {
      day = dayCandidate;
      continue;
    }
    if (timeCandidate) {
      time = timeCandidate;
      if (afterTime && !normalizeTime(afterTime)) subject = afterTime;
      pendingGroups = [];
      lastRows = [];
      continue;
    }

    const room = normalizeRoom(token);
    if (/^(Otaq|Auditoriya)/i.test(token) || (/^\d{3}$/.test(token) && lastRows.length)) {
      if (room) {
        for (const row of lastRows) {
          if (!row.Auditoriya) row.Auditoriya = room;
        }
      }
      const remainder = token.replace(/^(Otaq|Auditoriya)\s*[-:]?\s*\d{2,4}\s*/i, '').trim();
      if (remainder) subject = remainder;
      continue;
    }

    const groups = splitGroups(token);
    if (groups.length && !isTeacherToken(token)) {
      pendingGroups = groups;
      continue;
    }

    if (isTeacherToken(token) && subject && pendingGroups.length && day && time) {
      lastRows = [];
      for (const group of pendingGroups) {
        const row = {
          'Fakültə': FACULTIES[1].name,
          Kurs: '1',
          Sektor: 'ru',
          'Gün': day,
          Saat: time,
          Qrup: group,
          'Fənn': subject,
          'Müəllim': token,
          Auditoriya: '',
        };
        if (addRow(rows, row)) lastRows.push(row);
      }
      pendingGroups = [];
      continue;
    }

    if (!/^Sem$/i.test(token) && !/^lab$/i.test(token)) {
      subject = token;
    }
  }

  return rows;
}

function buildSchedules(rows) {
  const dedupedRows = [];
  const duplicateRows = [];
  const seenRow = new Set();

  for (const row of rows) {
    const key = ['Fakültə', 'Kurs', 'Sektor', 'Gün', 'Saat', 'Qrup', 'Fənn', 'Müəllim', 'Auditoriya'].map(field => oneLine(row[field])).join('||');
    if (seenRow.has(key)) {
      duplicateRows.push(row);
      continue;
    }
    seenRow.add(key);
    dedupedRows.push(row);
  }

  const schedules = new Map();
  const duplicateCellEntries = [];
  for (const row of dedupedRows) {
    const scheduleKey = `${row['Fakültə']}||${row.Kurs}||${row.Sektor}`;
    if (!schedules.has(scheduleKey)) {
      schedules.set(scheduleKey, { facultyName: row['Fakültə'], courseYear: Number(row.Kurs), sector: row.Sektor, groups: [], cells: {}, cellKeys: new Map() });
    }
    const schedule = schedules.get(scheduleKey);
    let groupIndex = schedule.groups.indexOf(row.Qrup);
    if (groupIndex === -1) {
      groupIndex = schedule.groups.length;
      schedule.groups.push(row.Qrup);
    }
    const cellKey = `${DAY_INDEX.get(row['Gün'])}_${SLOT_INDEX.get(row.Saat)}_${groupIndex}`;
    const entryKey = [row['Fənn'], row['Müəllim'], row.Auditoriya].map(oneLine).join('||');
    const seenEntries = schedule.cellKeys.get(cellKey) || new Set();
    if (seenEntries.has(entryKey)) {
      duplicateCellEntries.push(row);
      continue;
    }
    seenEntries.add(entryKey);
    schedule.cellKeys.set(cellKey, seenEntries);
    const existing = schedule.cells[cellKey] || { s: '', t: '', r: '' };
    schedule.cells[cellKey] = {
      s: existing.s ? `${existing.s}\n${row['Fənn']}` : row['Fənn'],
      t: existing.t ? `${existing.t}\n${row['Müəllim']}` : row['Müəllim'],
      r: existing.r ? `${existing.r}\n${row.Auditoriya}` : row.Auditoriya,
    };
  }

  return {
    schedules: [...schedules.values()].map(({ cellKeys, ...schedule }) => schedule),
    duplicateRows,
    duplicateCellEntries,
  };
}

async function ensureCanonicalFaculties(sql) {
  const facultyIds = new Map();
  for (let index = 0; index < FACULTIES.length; index += 1) {
    const faculty = FACULTIES[index];
    const rows = await sql`
      SELECT id, name FROM faculties
      WHERE lower(regexp_replace(name, '\\s+fakültəsi$', '', 'i')) = lower(regexp_replace(${faculty.name}, '\\s+fakültəsi$', '', 'i'))
      ORDER BY CASE WHEN name = ${faculty.name} THEN 0 ELSE 1 END, id
      LIMIT 1
    `;
    if (rows.length) {
      await sql`UPDATE faculties SET name = ${faculty.name}, sort_order = ${index}, active = true WHERE id = ${rows[0].id}`;
      facultyIds.set(faculty.name, rows[0].id);
    } else {
      const inserted = await sql`INSERT INTO faculties (name, sort_order, active) VALUES (${faculty.name}, ${index}, true) RETURNING id`;
      facultyIds.set(faculty.name, inserted[0].id);
    }
  }

  const canonicalIds = [...facultyIds.values()];
  await sql`UPDATE faculties SET active = false WHERE id <> ALL(${canonicalIds})`;
  return facultyIds;
}

async function importSchedules(sql, schedules) {
  await sql`DELETE FROM schedules`;
  const facultyIds = await ensureCanonicalFaculties(sql);
  const imported = [];
  for (const schedule of schedules) {
    const facultyId = facultyIds.get(schedule.facultyName);
    if (!facultyId) continue;
    const rows = await sql`
      INSERT INTO schedules (faculty_id, course_year, sector, groups, cells)
      VALUES (${facultyId}, ${schedule.courseYear}, ${schedule.sector}, ${JSON.stringify(schedule.groups)}::jsonb, ${JSON.stringify(schedule.cells)}::jsonb)
      ON CONFLICT (faculty_id, course_year, sector)
      DO UPDATE SET groups = EXCLUDED.groups, cells = EXCLUDED.cells, updated_at = now()
      RETURNING id
    `;
    imported.push({ id: rows[0].id, faculty_id: facultyId, ...schedule, groups: schedule.groups.length, cells: Object.keys(schedule.cells).length });
  }
  return imported;
}

const natureDocxRows = readNatureDocxRows();
const rows = [
  ...readFallbackRows(),
  ...readEconomicsSeedRows(),
  ...(natureDocxRows.length ? natureDocxRows : readNatureRows()),
  ...readPdfRows(),
];
const { schedules, duplicateRows, duplicateCellEntries } = buildSchedules(rows);

console.log(`Clean rows: ${rows.length}`);
console.log(`Exact duplicate rows skipped: ${duplicateRows.length}`);
console.log(`Duplicate cell entries skipped: ${duplicateCellEntries.length}`);
console.log(`Schedules: ${schedules.length}`);
for (const schedule of schedules) {
  console.log(`- ${schedule.facultyName} | course ${schedule.courseYear} | ${schedule.sector}: ${schedule.groups.length} groups, ${Object.keys(schedule.cells).length} cells`);
}

if (process.argv.includes('--dry-run')) process.exit(0);
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const imported = await importSchedules(sql, schedules);
console.log('Imported schedules:');
for (const item of imported) {
  console.log(`- #${item.id} faculty_id=${item.faculty_id} ${item.facultyName} course ${item.courseYear} ${item.sector}: ${item.groups} groups, ${item.cells} cells`);
}
