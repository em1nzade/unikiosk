export interface NormalizedAnnouncementTable {
  headers: string[];
  rows: string[][];
}

export type AnnouncementTheme = 'red' | 'amber' | 'blue' | 'emerald' | 'neutral';

export const ANNOUNCEMENT_THEMES: AnnouncementTheme[] = ['red', 'amber', 'blue', 'emerald', 'neutral'];

export function normalizeAnnouncementTheme(theme?: unknown): AnnouncementTheme {
  return ANNOUNCEMENT_THEMES.includes(theme as AnnouncementTheme) ? theme as AnnouncementTheme : 'neutral';
}

export function formatAnnouncementTableCell(value: string): string {
  return value
    .replace(/(\d{4})\s*(\d{1,2}:\d{2})/u, '$1\n$2')
    .trim();
}

export function normalizeAnnouncementTable(headers?: unknown, rows?: unknown): NormalizedAnnouncementTable | null {
  if (!Array.isArray(headers) || !Array.isArray(rows)) return null;
  const cleanHeaders = headers
    .map(header => String(header ?? '').trim())
    .filter(Boolean);
  if (cleanHeaders.length === 0) return null;

  const cleanRows = rows
    .filter(Array.isArray)
    .map(row => cleanHeaders.map((_, index) => formatAnnouncementTableCell(String(row[index] ?? ''))))
    .filter(row => row.some(Boolean));

  if (cleanRows.length === 0) return null;
  return { headers: cleanHeaders, rows: cleanRows };
}

export function splitActiveItems<T extends { active?: boolean }>(items: T[]): { active: T[]; archived: T[] } {
  return {
    active: items.filter(item => item.active !== false),
    archived: items.filter(item => item.active === false),
  };
}
