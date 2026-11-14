const CAIRO_ZONE = 'Africa/Cairo';

export interface CairoNow {
  /** yyyy-MM-dd بتوقيت القاهرة */
  date: string;
  /** 0 - 23 بتوقيت القاهرة */
  hour: number;
}

export function getCairoNow(now: Date = new Date()): CairoNow {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CAIRO_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number(get('hour')),
  };
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86_400_000);
}

/** السيرفر بياخد التاريخ بس ويثبّت الساعة 12:00 بتوقيت القاهرة */
export function toNoonIso(date: string): string {
  return `${date}T12:00:00+03:00`;
}