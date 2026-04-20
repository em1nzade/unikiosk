export interface Announcement {
  id: number;
  title: string;
  description: string;
  type: string;
  importance: 'high' | 'medium' | 'low';
  date: string;
  active: boolean;
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

export interface KioskData {
  announcements: Announcement[];
  faculties: Faculty[];
  events: Event[];
  cafeteria: CafeteriaCategory[];
  info: InfoContent[];
  settings: KioskSettings;
  etag: string;
}

export interface KioskSettings {
  ticker_enabled: boolean;
  ticker_mode: 'scroll' | 'static';
  ticker_pinned_id: number | null;
  default_language: string;
  kiosk_paused?: boolean;
}
