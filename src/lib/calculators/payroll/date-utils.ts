export function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;
  return date;
}

export function ageInMonthsAt(birth: Date, at: Date): number {
  let months = (at.getUTCFullYear() - birth.getUTCFullYear()) * 12;
  months += at.getUTCMonth() - birth.getUTCMonth();
  if (at.getUTCDate() < birth.getUTCDate()) months -= 1;
  return months;
}

export function endOfAnniversaryMonth(start: Date, years: number): Date {
  return new Date(Date.UTC(start.getUTCFullYear() + years, start.getUTCMonth() + 1, 0));
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isIntegerWon(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}

