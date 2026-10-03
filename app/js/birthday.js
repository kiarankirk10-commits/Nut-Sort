// Birthdays (pure). The list lives in config.BIRTHDAYS — add more people there.
import { BIRTHDAYS } from './config.js';
import { parseDate } from './dates.js';

/** The person whose birthday is on this local date, or null. */
export function birthdayOn(dateStr, list = BIRTHDAYS) {
  const { m, d } = parseDate(dateStr);
  return list.find((b) => b.month === m && b.day === d) || null;
}

/**
 * The active birthday treatment: a real birthday today, or the Settings preview.
 * Returns { person, real } or null.
 */
export function activeBirthday(dateStr, previewName, list = BIRTHDAYS) {
  const real = birthdayOn(dateStr, list);
  if (real) return { person: real, real: true };
  if (previewName) {
    const p = list.find((b) => b.name === previewName);
    if (p) return { person: p, real: false };
  }
  return null;
}
