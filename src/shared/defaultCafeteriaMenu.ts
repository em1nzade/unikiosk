import type { CafeteriaCategory } from './types';

type MenuSeedItem = {
  name: string;
  price: number;
};

type MenuSeedCategory = {
  id: number;
  name: string;
  sort_order: number;
  highlight: boolean;
  items: MenuSeedItem[];
};

const MENU_SEED: MenuSeedCategory[] = [
  {
    id: 1001,
    name: 'Əsas yeməklər',
    sort_order: 1,
    highlight: true,
    items: [
      { name: 'Şorba', price: 1 },
      { name: 'Aş', price: 1 },
      { name: 'Qreçka', price: 1 },
      { name: 'Balıq', price: 1 },
      { name: 'Makaron', price: 1 },
      { name: 'Kartof qızartması', price: 1 },
      { name: 'Püre', price: 1 },
      { name: 'Sosiska kartof', price: 2 },
      { name: 'Badımcan qızartması', price: 1 },
      { name: 'Badımcan çığırtması', price: 1 },
      { name: 'Lobya', price: 2 },
      { name: 'Jülyen', price: 2 },
      { name: 'Toyuq qızartması (ədəd)', price: 1 },
      { name: 'Kotlet (ədəd)', price: 1 },
      { name: 'Toyuq qulyaş', price: 1 },
      { name: 'Lanqet (ədəd)', price: 1 },
      { name: 'Mal qulyaş', price: 3 },
      { name: 'Döymə kotlet (ədəd)', price: 1 },
      { name: 'Naggets', price: 1 },
      { name: 'Dolma (kələm)', price: 3 },
      { name: 'Lobya kürüsü', price: 1 },
      { name: 'Gül kələm', price: 1 },
      { name: 'Kabaqçı', price: 1 },
      { name: 'Dovğa', price: 1 },
      { name: 'Burger', price: 1.5 },
      { name: 'Pizza', price: 1 },
      { name: 'Peraşki', price: 0.5 },
      { name: 'Hotdog', price: 0.5 },
    ],
  },
  {
    id: 1002,
    name: 'Salatlar',
    sort_order: 2,
    highlight: false,
    items: [
      { name: 'Paytaxt salat', price: 2 },
      { name: 'Mimoza', price: 2 },
      { name: 'Şuba salatı', price: 2 },
      { name: 'Pomidor-xiyar salatı', price: 1 },
    ],
  },
  {
    id: 1003,
    name: 'Atıştırmalıqlar',
    sort_order: 3,
    highlight: false,
    items: [
      { name: 'Qoğal', price: 0.8 },
      { name: 'Simit', price: 1 },
      { name: 'Xaçapuri', price: 1.2 },
      { name: 'Cəmli bulka', price: 0.7 },
      { name: 'Kruassan', price: 1 },
      { name: 'Şirin qoğal', price: 0.8 },
      { name: 'Şor qoğal', price: 0.8 },
      { name: 'Popkorn', price: 0.7 },
      { name: 'Cini', price: 1.2 },
      { name: 'Tutku (böyük)', price: 1.2 },
      { name: 'Tutku (balaca)', price: 0.7 },
      { name: 'Biscolata (böyük)', price: 1.5 },
      { name: 'Biscolata (balaca)', price: 0.8 },
      { name: 'Benimo', price: 1.2 },
      { name: 'Biskrem (böyük)', price: 1.2 },
      { name: 'Biskrem (balaca)', price: 0.7 },
      { name: 'Çizi', price: 1 },
      { name: 'Hoşbeş', price: 0.7 },
      { name: 'Hoşbeş gofret', price: 1 },
      { name: 'Adicto keks', price: 0.7 },
      { name: 'Adicto', price: 1 },
      { name: 'Keks', price: 0.8 },
      { name: 'Türk paxlavası', price: 0.5 },
      { name: 'Çərəz', price: 0.7 },
      { name: 'Partlayan çərəz', price: 1 },
      { name: 'Sadə çərəz', price: 0.5 },
      { name: 'Kat-kat', price: 0.7 },
      { name: 'Ozmo oyun', price: 0.7 },
      { name: 'Ozmo (balaca)', price: 0.8 },
      { name: 'Skram', price: 1 },
      { name: 'Halley', price: 1.5 },
      { name: 'Snickers', price: 1.5 },
      { name: 'Twix', price: 1.5 },
      { name: 'Bounty', price: 1.5 },
      { name: 'Albeni', price: 1.2 },
    ],
  },
  {
    id: 1004,
    name: 'İçkilər',
    sort_order: 4,
    highlight: false,
    items: [
      { name: 'Çay', price: 0.3 },
      { name: 'Kofe', price: 0.5 },
      { name: 'Stəkan kola', price: 0.5 },
      { name: 'Ayran', price: 0.5 },
      { name: 'Natura sok', price: 0.6 },
      { name: 'Fuse Tea', price: 1 },
      { name: 'Cappy', price: 1 },
      { name: 'Su', price: 0.5 },
      { name: 'Cola', price: 1 },
      { name: 'Fanta', price: 1 },
      { name: 'Sprite', price: 1 },
      { name: 'Qızıl Quyu suları', price: 0.8 },
    ],
  },
  {
    id: 1005,
    name: 'Digər',
    sort_order: 5,
    highlight: false,
    items: [
      { name: 'Salfetka', price: 0.5 },
    ],
  },
];

export const DEFAULT_CAFETERIA_MENU: CafeteriaCategory[] = MENU_SEED.map(category => ({
  id: category.id,
  name: category.name,
  sort_order: category.sort_order,
  highlight: category.highlight,
  items: category.items.map((item, index) => ({
    id: category.id * 100 + index + 1,
    category_id: category.id,
    name: item.name,
    price: item.price,
    sort_order: index + 1,
  })),
}));
