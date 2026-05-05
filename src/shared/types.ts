export interface Announcement {
  id: number;
  title: string;
  description: string;
  type: string;
  importance: 'high' | 'medium' | 'low';
  date: string;
  active: boolean;
  faculty_id?: number | null;
  image_url?: string | null;
  table_headers?: string[] | null;
  table_rows?: string[][] | null;
  theme?: 'red' | 'amber' | 'blue' | 'emerald' | 'neutral' | null;
}

export interface DeptContent {
  id: number;
  department_id: number;
  type: 'schedule' | 'announcement' | 'exam';
  course_year: number | null;
  title: string;
  description: string | null;
  image_url: string | null;
  extra: Record<string, any>;
  sort_order: number;
  active: boolean;
}

export interface Department {
  id: number;
  faculty_id: number;
  name: string;
  sort_order: number;
  active: boolean;
  content: DeptContent[];
}

export interface Faculty {
  id: number;
  name: string;
  sort_order: number;
  active: boolean;
  departments: Department[];
}

export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time_slot: string;
  location: string;
  type: string;
  image_url: string | null;
  active: boolean;
}

export interface CafeteriaCategory {
  id: number;
  name: string;
  sort_order: number;
  highlight: boolean;
  items: CafeteriaItem[];
}

export interface CafeteriaItem {
  id: number;
  category_id: number;
  name: string;
  price: number | null;
  sort_order: number;
}

export interface InfoContent {
  id: number;
  section: string;
  title: string;
  content: string;
  sort_order: number;
}

export interface FeedbackMessage {
  id: number;
  category: 'teklif' | 'irad';
  message: string;
  name: string | null;
  contact: string | null;
  status: 'new' | 'read';
  user_agent: string | null;
  created_at: string;
}

export interface KioskData {
  announcements: Announcement[];
  faculties: Faculty[];
  schedules: Schedule[];
  events: Event[];
  cafeteria: CafeteriaCategory[];
  info: InfoContent[];
  settings: KioskSettings;
  etag: string;
}

export interface ScheduleCell {
  s: string; // subject
  t: string; // teacher
  r: string; // room
}

export interface Schedule {
  id: number;
  faculty_id: number;
  course_year: number;
  sector: string;
  groups: string[];
  cells: Record<string, ScheduleCell>; // key: "day_slot_groupIndex"
  updated_at: string;
}

export interface KioskSettings {
  ticker_enabled: boolean;
  ticker_mode: 'scroll' | 'static';
  ticker_pinned_id: number | null;
  default_language: string;
  kiosk_paused?: boolean;
  sleep_screen_enabled?: boolean;
  sync_requested_at?: string | null;
}
