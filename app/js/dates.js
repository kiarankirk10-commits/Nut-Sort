// Local-date helpers. All game dates are local 'YYYY-MM-DD' strings (phone clock, local timezone).
// Day arithmetic goes through UTC day numbers so DST changes never shift a day.

export function localDateStr(d = new Date()) {
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return { y, m, d };
}

/** Days since 1970-01-01 for a local date string. */
export function dayNumber(str) {
  const { y, m, d } = parseDate(str);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

export function daysBetween(a, b) {
  return dayNumber(b) - dayNumber(a);
}

export function addDays(str, n) {
  const dt = new Date((dayNumber(str) + n) * 86400000);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

/** Deterministic daily board index: days since epoch mod pool size. */
export function dailyIndex(str, poolSize) {
  const n = dayNumber(str);
  return ((n % poolSize) + poolSize) % poolSize;
}

const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "FRI 2 OCT" */
export function chipLabel(str) {
  const n = dayNumber(str);
  const dt = new Date(n * 86400000);
  return `${DOW[dt.getUTCDay()]} ${dt.getUTCDate()} ${MON[dt.getUTCMonth()]}`;
}
/** "15 March" */
export function longDay(month, day) {
  return `${day} ${MONTH_LONG[month - 1]}`;
}
/** Weekday index 0=Mon..6=Sun */
export function weekdayMon0(str) {
  const dt = new Date(dayNumber(str) * 86400000);
  return (dt.getUTCDay() + 6) % 7;
}
