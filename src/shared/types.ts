export interface Announcement {
  id: number;
  title: string;
  description: string;
  type: string;
  importance: 'high' | 'medium' | 'low';
  date: string;
  active: boolean;
}

export interface Exam {
  id: number;
  subject: string;
  faculty: string;
  group_number: string;
  room: string;
  time_slot: string;
  exam_date: string;
  exam_month: string;
  active: boolean;
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
  exams: Exam[];
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
}
