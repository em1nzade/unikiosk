const { neon } = require('@neondatabase/serverless');
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

(async () => {
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
  console.log('schedules table created');

  // Check faculty_id for İqtisadiyyat
  const facs = await sql`SELECT id, name FROM faculties ORDER BY id`;
  console.log('Faculties:', facs);
})().catch(e => console.error(e));
