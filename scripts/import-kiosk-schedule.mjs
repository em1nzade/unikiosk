import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

const DEFAULT_INPUTS = ['/Users/barbie/Documents/New project 4/sorgular/outputs/kiosk-schedule.json'];
const DAY_INDEX = new Map([
  ['I', 1],
  ['II', 2],
  ['III', 3],
  ['IV', 4],
  ['V', 5],
]);
const SLOT_INDEX = new Map([
  ['08:00-09:20', 1],
  ['09:35-10:55', 2],
  ['11:10-12:30', 3],
  ['12:45-14:05', 4],
  ['14:20-15:40', 5],
  ['15:55-17:15', 6],
]);
const REPORT_FIELDS = ['Fakültə', 'Kurs', 'Sektor', 'Gün', 'Saat', 'Qrup', 'Fənn', 'Müəllim', 'Auditoriya'];

function readArgs() {
  const args = process.argv.slice(2);
  const inputs = args.filter(arg => !arg.startsWith('--'));
  return {
    dryRun: args.includes('--dry-run'),
    inputs: inputs.length ? inputs : DEFAULT_INPUTS,
  };
}

function clean(value) {
  return String(value ?? '').trim();
}

function appendLine(previous, next) {
  const value = clean(next);
  if (!value) return previous;
  return previous ? `${previous}\n${value}` : value;
}

function buildSchedules(rows) {
  const schedules = new Map();
  const warnings = [];
  const blankFieldsByFaculty = new Map();
  const facultyNames = new Set();
  const seenRows = new Set();

  for (const [idx, row] of rows.entries()) {
    const facultyName = clean(row['Fakültə']);
    if (facultyName) facultyNames.add(facultyName);
    const courseYear = Number(row.Kurs);
    const sector = clean(row.Sektor).toLowerCase() || 'az';
    const group = clean(row.Qrup);
    const dayValue = clean(row['Gün']);
    const timeValue = clean(row.Saat);
    const day = DAY_INDEX.get(dayValue);
    const slot = SLOT_INDEX.get(timeValue);
    const requiredFields = {
      Fakültə: facultyName,
      Kurs: clean(row.Kurs),
      Sektor: sector,
      Gün: dayValue,
      Saat: timeValue,
      Qrup: group,
      Fənn: clean(row['Fənn']),
    };

    for (const field of REPORT_FIELDS) {
      const value = field === 'Sektor' ? sector : clean(row[field]);
      if (!value || (field === 'Gün' && !day) || (field === 'Saat' && !slot)) {
        const key = facultyName || '(empty faculty)';
        if (!blankFieldsByFaculty.has(key)) blankFieldsByFaculty.set(key, new Map());
        const facultyBlanks = blankFieldsByFaculty.get(key);
        facultyBlanks.set(field, (facultyBlanks.get(field) || 0) + 1);
      }
    }

    if (!facultyName || !courseYear || !sector || !group || !day || !slot) {
      warnings.push(`Skipped row ${idx + 1}: missing required schedule fields`);
      continue;
    }

    const rowKey = [
      facultyName,
      courseYear,
      sector,
      dayValue,
      timeValue,
      group,
      clean(row['Fənn']),
      clean(row['Müəllim']),
      clean(row.Auditoriya),
    ].join('||');
    if (seenRows.has(rowKey)) continue;
    seenRows.add(rowKey);

    const scheduleKey = `${facultyName}||${courseYear}||${sector}`;
    if (!schedules.has(scheduleKey)) {
      schedules.set(scheduleKey, {
        facultyName,
        courseYear,
        sector,
        groups: [],
        cells: {},
      });
    }

    const schedule = schedules.get(scheduleKey);
    let groupIndex = schedule.groups.indexOf(group);
    if (groupIndex === -1) {
      groupIndex = schedule.groups.length;
      schedule.groups.push(group);
    }

    const cellKey = `${day}_${slot}_${groupIndex}`;
    const existing = schedule.cells[cellKey] || { s: '', t: '', r: '' };
    schedule.cells[cellKey] = {
      s: appendLine(existing.s, row['Fənn']),
      t: appendLine(existing.t, row['Müəllim']),
      r: appendLine(existing.r, row.Auditoriya),
    };
  }

  return { facultyNames: [...facultyNames], schedules: [...schedules.values()], warnings, blankFieldsByFaculty };
}

async function ensureTables(sql) {
  await sql`CREATE TABLE IF NOT EXISTS faculties (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    faculty_id INT NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
    course_year INT NOT NULL CHECK (course_year BETWEEN 1 AND 4),
    sector VARCHAR(10) NOT NULL DEFAULT 'az',
    groups JSONB NOT NULL DEFAULT '[]'::jsonb,
    cells JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(faculty_id, course_year, sector)
  )`;
}

async function importSchedules(sql, schedules) {
  const result = [];

  for (const schedule of schedules) {
    let facultyRows = await sql`
      SELECT id, name FROM faculties
      WHERE lower(name) = lower(${schedule.facultyName})
      ORDER BY id
      LIMIT 1
    `;
    if (facultyRows.length) {
      await sql`UPDATE faculties SET active = true WHERE id = ${facultyRows[0].id}`;
    } else {
      facultyRows = await sql`
        INSERT INTO faculties (name, sort_order, active)
        VALUES (${schedule.facultyName}, 0, true)
        RETURNING id, name
      `;
    }
    const faculty = facultyRows[0];
    const rows = await sql`
      INSERT INTO schedules (faculty_id, course_year, sector, groups, cells)
      VALUES (
        ${faculty.id},
        ${schedule.courseYear},
        ${schedule.sector},
        ${JSON.stringify(schedule.groups)}::jsonb,
        ${JSON.stringify(schedule.cells)}::jsonb
      )
      ON CONFLICT (faculty_id, course_year, sector)
      DO UPDATE SET groups = EXCLUDED.groups, cells = EXCLUDED.cells, updated_at = now()
      RETURNING id
    `;
    result.push({
      id: rows[0].id,
      faculty_id: faculty.id,
      faculty: faculty.name,
      course_year: schedule.courseYear,
      sector: schedule.sector,
      groups: schedule.groups.length,
      cells: Object.keys(schedule.cells).length,
    });
  }

  return result;
}

async function ensureFaculties(sql, facultyNames) {
  const result = [];

  for (const facultyName of facultyNames) {
    let facultyRows = await sql`
      SELECT id, name FROM faculties
      WHERE lower(name) = lower(${facultyName})
      ORDER BY id
      LIMIT 1
    `;
    if (facultyRows.length) {
      await sql`UPDATE faculties SET active = true WHERE id = ${facultyRows[0].id}`;
    } else {
      facultyRows = await sql`
        INSERT INTO faculties (name, sort_order, active)
        VALUES (${facultyName}, 0, true)
        RETURNING id, name
      `;
    }
    result.push(facultyRows[0]);
  }

  return result;
}

const { dryRun, inputs } = readArgs();
const rows = inputs.flatMap(input => {
  const sourcePath = path.resolve(input);
  return JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
});
const { facultyNames, schedules, warnings, blankFieldsByFaculty } = buildSchedules(rows);

console.log(`Input rows: ${rows.length}`);
console.log(`Faculties: ${facultyNames.length}`);
console.log(`Schedules: ${schedules.length}`);
for (const schedule of schedules) {
  console.log(`- ${schedule.facultyName} | course ${schedule.courseYear} | ${schedule.sector}: ${schedule.groups.length} groups, ${Object.keys(schedule.cells).length} cells`);
}
if (warnings.length) {
  console.log(`Warnings: ${warnings.length}`);
  for (const warning of warnings.slice(0, 20)) console.log(`  ${warning}`);
}
if (blankFieldsByFaculty.size) {
  console.log('Blank or unsupported fields by faculty:');
  for (const [faculty, fields] of blankFieldsByFaculty.entries()) {
    const summary = [...fields.entries()].map(([field, count]) => `${field}: ${count}`).join(', ');
    console.log(`- ${faculty}: ${summary}`);
  }
}

if (dryRun) {
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. Run with DATABASE_URL set.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
await ensureTables(sql);
const ensuredFaculties = await ensureFaculties(sql, facultyNames);
const imported = await importSchedules(sql, schedules);
console.log(`Ensured faculties: ${ensuredFaculties.length}`);
console.log('Imported schedules:');
for (const item of imported) {
  console.log(`- #${item.id} faculty_id=${item.faculty_id} ${item.faculty} course ${item.course_year} ${item.sector}: ${item.groups} groups, ${item.cells} cells`);
}
