// Facts of DEMEX for the home page. Source: veon/client.json (company.contacts, socials, facts C-001…C-027)
// and audit/raw/text/*.txt (texts of the client's own pages, 2026-11-12). Nothing here is invented.

export const FUTURE_NOTE = "Розділ у розробці";

export interface Phone { label: string; display: string; tel: string; }

export const phones: Phone[] = [
  { label: "", display: "(095) 166-30-90", tel: "+380951663090" },
  { label: "", display: "(097) 166-30-90", tel: "+380971663090" },
  { label: "Менеджер з опту", display: "(093) 166-30-90", tel: "+380931663090" },
  { label: "", display: "(044) 334 78 24", tel: "+380443347824" },
];

export const mainPhone = phones[0]!;
export const wholesalePhone = phones[2]!;
export const email = "zakaz@demex.com.ua";

export const hours = [
  { days: "Пн–Пт", time: "09:00–19:00" },
  { days: "Сб", time: "09:00–18:00" },
  { days: "Нд", time: "вихідний" },
];

export const address = {
  street: "бульвар Верховної Ради, 33/1",
  city: "Київ",
  postal: "02094",
  entrance: "в'їзд з вул. Юрія Поправки",
  map: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Київ, бульвар Верховної Ради 33/1"),
};

export interface Social { name: string; label: string; href: string; }
export const socials: Social[] = [
  { name: "telegram", label: "Telegram-канал", href: "https://t.me/demex_com_ua" },
  { name: "viber", label: "Viber-спільнота DEMEX", href: "https://invite.viber.com/?g2=AQBYAHQFCUsywFQxkgvt52DsgGCDtKfMm9yib13P15qOHfKdpWd6u%2BUnAA4avRlb" },
  { name: "facebook", label: "Facebook", href: "https://www.facebook.com/demex.ua/" },
  { name: "instagram", label: "Instagram", href: "https://www.instagram.com/demex.ua/" },
  { name: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@demex.ua" },
];
export const viber = socials[1]!;

const nl = "\n";
export const vinBody = (vin: string) =>
  ["VIN: " + vin, "Марка, модель, рік: ", "Яка деталь потрібна: ", "Номер старої деталі (якщо є): ", "Телефон: "].join(nl);

export const mailto = (subject: string, body: string) =>
  `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export const vinMailto = (vin = "") => mailto("Запит по VIN", vinBody(vin));
export const partMailto = mailto(
  "Запит по артикулу",
  ["Артикул або номер деталі: ", "Марка, модель, рік: ", "Телефон: "].join(nl),
);

// VIN scheme (ISO 3779): real segments, shown as a diagram under the 17 cells.
export const vinSegments = [
  { from: 1, to: 3, label: "виробник" },
  { from: 4, to: 9, label: "модель, кузов, двигун" },
  { from: 10, to: 10, label: "рік моделі" },
  { from: 11, to: 11, label: "завод" },
  { from: 12, to: 17, label: "серійний номер" },
];

// Top-level catalog of the current site (audit/raw/home-structure.md).
export const categories = [
  "Запчастини для ТО",
  "Гальмівна система",
  "Підвіска та рульове",
  "Двигун та система вихлопу",
  "Коробка передач",
  "Охолодження та опалення",
  "Електрика та освітлення",
  "Кузов та складові",
  "Автотовари та автохімія",
  "Інструмент та аксесуари",
  "Шини та диски",
];

// 16 makes from the current site's list (~58 makes, «Acura … Volvo»); order is a UI decision (concept §5, R-002).
export const makes = [
  "Volkswagen", "Skoda", "Audi", "Toyota", "Renault", "Opel", "BMW", "Mercedes-Benz",
  "Ford", "Hyundai", "Kia", "Nissan", "Mazda", "Mitsubishi", "Peugeot", "Chevrolet",
];
