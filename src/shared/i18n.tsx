import { createContext, useContext, useState, type ReactNode } from 'react';

export type Lang = 'az' | 'en' | 'ru';

const translations = {
  // Screensaver
  'uni.name': { az: 'Odlar Yurdu Universiteti', en: 'Odlar Yurdu University', ru: 'Университет Одлар Юрду' },
  'kiosk.title': { az: 'İnformasiya Kiosku', en: 'Information Kiosk', ru: 'Информационный Киоск' },
  'kiosk.touch': { az: 'Başlamaq üçün ekrana toxunun', en: 'Touch the screen to start', ru: 'Коснитесь экрана для начала' },

  // Navigation
  'nav.home': { az: 'Ana Səhifə', en: 'Home', ru: 'Главная' },
  'nav.exams': { az: 'İmtahan Cədvəlləri', en: 'Exam Schedules', ru: 'Расписание экзаменов' },
  'nav.exams.desc': { az: 'Fakültələr və qruplar üzrə ən son imtahan və dərs cədvəlləri', en: 'Latest exam and class schedules by faculties and groups', ru: 'Расписание экзаменов по факультетам и группам' },
  'nav.map': { az: 'Xəritə', en: 'Map', ru: 'Карта' },
  'nav.map.desc': { az: 'Auditoriyalar', en: 'Classrooms', ru: 'Аудитории' },
  'nav.info': { az: 'Məlumat', en: 'Information', ru: 'Информация' },
  'nav.info.desc': { az: 'Əlaqə & Haqqında', en: 'Contact & About', ru: 'Контакты' },
  'nav.events': { az: 'Tədbirlər və Konfranslar', en: 'Events & Conferences', ru: 'Мероприятия и Конференции' },
  'nav.events.desc': { az: 'Bütün tədbirlər üçün qeydiyyat', en: 'Registration for all events', ru: 'Регистрация на мероприятия' },
  'nav.cafeteria': { az: 'Yeməkxana', en: 'Cafeteria', ru: 'Столовая' },
  'nav.cafeteria.desc': { az: 'Gündəlik menyu', en: 'Daily menu', ru: 'Меню дня' },
  'nav.announcements': { az: 'Universitet üzrə Elanlar', en: 'University Announcements', ru: 'Объявления университета' },

  // Header titles
  'title.map': { az: 'Xəritə və Yönləndirmə', en: 'Map & Navigation', ru: 'Карта и Навигация' },
  'title.exams': { az: 'İmtahan Cədvəli', en: 'Exam Schedule', ru: 'Расписание экзаменов' },
  'title.events': { az: 'Tədbirlər', en: 'Events', ru: 'Мероприятия' },
  'title.cafeteria': { az: 'Tələbə Yeməkxanası', en: 'Student Cafeteria', ru: 'Студенческая столовая' },
  'title.info': { az: 'Ümumi Məlumat', en: 'General Information', ru: 'Общая информация' },
  'title.announcements': { az: 'Universitet üzrə Elanlar', en: 'University Announcements', ru: 'Объявления' },

  // Exams view
  'exams.title': { az: 'İmtahan Cədvəli', en: 'Exam Schedule', ru: 'Расписание экзаменов' },
  'exams.enter.group': { az: 'İmtahanlarınızı görmək üçün qrup nömrənizi daxil edin.', en: 'Enter your group number to see your exams.', ru: 'Введите номер группы для просмотра экзаменов.' },
  'exams.placeholder': { az: 'Məsələn: 652', en: 'E.g.: 652', ru: 'Например: 652' },
  'exams.search': { az: 'Axtar', en: 'Search', ru: 'Поиск' },
  'exams.group': { az: 'Qrup', en: 'Group', ru: 'Группа' },
  'exams.other.group': { az: 'Başqa qrup axtar', en: 'Search other group', ru: 'Поиск другой группы' },
  'exams.not.found': { az: 'Heç nə tapılmadı', en: 'Nothing found', ru: 'Ничего не найдено' },
  'exams.not.found.desc': { az: 'qrupu üçün imtahan cədvəli tapılmadı.', en: 'exam schedule not found for group', ru: 'расписание экзаменов для группы не найдено.' },

  // Events detail
  'events.about': { az: 'Tədbir haqqında', en: 'About the event', ru: 'О мероприятии' },
  'events.register': { az: 'İştirak üçün qeydiyyatdan keç', en: 'Register to participate', ru: 'Зарегистрируйтесь' },
  'events.details': { az: 'Təfərrüatlar', en: 'Details', ru: 'Детали' },
  'events.date': { az: 'Tarix', en: 'Date', ru: 'Дата' },
  'events.time': { az: 'Saat', en: 'Time', ru: 'Время' },
  'events.location': { az: 'Məkan', en: 'Location', ru: 'Место' },
  'events.back': { az: 'Bütün tədbirlərə qayıt', en: 'Back to all events', ru: 'Назад ко всем мероприятиям' },

  // Cafeteria
  'cafeteria.title': { az: 'Tələbə Yeməkxanası', en: 'Student Cafeteria', ru: 'Студенческая столовая' },
  'cafeteria.desc': { az: 'Tələbə və müəllimlər üçün nəzərdə tutulmuş gündəlik, sağlam və münasib qiymətli yemək menyusu.', en: 'Daily, healthy and affordable food menu for students and teachers.', ru: 'Ежедневное, здоровое и доступное меню для студентов и преподавателей.' },
  'cafeteria.total': { az: 'CƏMİ', en: 'TOTAL', ru: 'ИТОГО' },

  // Info
  'info.title': { az: 'Ümumi Məlumat', en: 'General Information', ru: 'Общая информация' },

  // Map
  'map.search': { az: 'Auditoriya, bina və ya obyekt axtar...', en: 'Search for a classroom, building or facility...', ru: 'Поиск аудитории, здания или объекта...' },
  'map.search.btn': { az: 'Axtar', en: 'Search', ru: 'Поиск' },
  'map.places': {
    az: ['Əsas Bina', 'Kitabxana', 'Yataqxana', 'İdman Zalı', 'Kafeteriya'],
    en: ['Main Building', 'Library', 'Dormitory', 'Sports Hall', 'Cafeteria'],
    ru: ['Главное здание', 'Библиотека', 'Общежитие', 'Спортзал', 'Кафетерий'],
  },

  // Pin overlay
  'pin.title': { az: 'Admin Çıxış', en: 'Admin Exit', ru: 'Выход админа' },
  'pin.enter': { az: 'PIN kodu daxil edin', en: 'Enter PIN code', ru: 'Введите PIN-код' },
  'pin.wrong': { az: 'Yanlış PIN kod', en: 'Wrong PIN code', ru: 'Неверный PIN-код' },
  'pin.delete': { az: 'Sil', en: 'Del', ru: 'Уд.' },
  'pin.cancel': { az: 'Ləğv et', en: 'Cancel', ru: 'Отмена' },
} as const;

type TranslationKey = keyof typeof translations;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string | string[];
}

const I18nContext = createContext<I18nContextType>(null!);

export const useI18n = () => useContext(I18nContext);

export function I18nProvider({ children, defaultLang = 'az' }: { children: ReactNode; defaultLang?: Lang }) {
  const [lang, setLang] = useState<Lang>(defaultLang);

  const t = (key: TranslationKey): string | string[] => {
    const entry = translations[key];
    if (!entry) return key;
    return (entry as any)[lang] || (entry as any)['az'] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}
