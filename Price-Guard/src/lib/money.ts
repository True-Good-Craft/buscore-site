/** Parse a user-input string to integer cents. Returns null on error. */
export function parseMoneyToCents(input: string): number | null {
  const s = input.trim();
  if (s === '') return null;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [whole, frac = ''] = s.split('.');
  const cents = parseInt(whole, 10) * 100 + parseInt((frac + '00').slice(0, 2), 10);
  return cents;
}

/** Parse a percentage string to integer basis points. Returns null on error. */
export function parsePercentToBps(input: string): number | null {
  const s = input.trim();
  if (s === '') return null;
  // Allow up to 2 decimal places (e.g., "6.55" -> 655 bps)
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const [whole, frac = ''] = s.split('.');
  const bps = parseInt(whole, 10) * 100 + parseInt((frac + '00').slice(0, 2), 10);
  return bps;
}

/** Format integer cents as a currency string */
export function formatCents(cents: number, symbol = '$'): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const c = abs % 100;
  return `${sign}${symbol}${dollars}.${String(c).padStart(2, '0')}`;
}

/** Round half-up (standard rounding) */
export function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

/** Parse integer (non-negative) */
export function parseNonNegativeInt(input: string): number | null {
  const s = input.trim();
  if (s === '') return null;
  if (!/^\d+$/.test(s)) return null;
  return parseInt(s, 10);
}
