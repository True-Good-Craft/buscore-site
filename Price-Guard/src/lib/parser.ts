import { RawInputs, ParsedInputs, ValidationError } from './types.js';
import { parseMoneyToCents, parsePercentToBps, parseNonNegativeInt } from './money.js';

export function parseInputs(raw: RawInputs): { parsed: ParsedInputs; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  function money(field: string, val: string, label: string, optional = false): number {
    if (val.trim() === '' && optional) return 0;
    const v = parseMoneyToCents(val);
    if (v === null) errors.push({ field, message: `${label}: enter a valid amount (e.g., 12.50)` });
    return v ?? 0;
  }

  function pct(field: string, val: string, label: string): number {
    const v = parsePercentToBps(val);
    if (v === null) errors.push({ field, message: `${label}: enter a valid percentage (e.g., 6.5)` });
    return v ?? 0;
  }

  function intField(field: string, val: string, label: string): number {
    const v = parseNonNegativeInt(val);
    if (v === null) errors.push({ field, message: `${label}: enter a whole number (e.g., 30)` });
    return v ?? 0;
  }

  const materialsCents = money('materials', raw.materials, 'Materials');
  const packagingCents = money('packaging', raw.packaging, 'Packaging');
  const laborMinutes = intField('laborMinutes', raw.laborMinutes, 'Labor minutes');
  const laborRateCents = money('laborRate', raw.laborRate, 'Labor rate');
  const overheadBps = raw.overheadMode === 'percent' ? pct('overheadPercent', raw.overheadPercent, 'Overhead %') : 0;
  const overheadFixedCents = raw.overheadMode === 'fixed' ? money('overheadFixed', raw.overheadFixed, 'Overhead $') : 0;
  const feePctBps = pct('feePct', raw.feePct, 'Fee %');
  const feeFixedCents = money('feeFixed', raw.feeFixed, 'Fee fixed $');
  const shippingCents = raw.shippingIncluded ? money('shippingCost', raw.shippingCost, 'Shipping $') : 0;
  const targetMarginBps = raw.goalMode === 'margin' ? pct('targetMargin', raw.targetMargin, 'Target margin %') : 0;
  const targetProfitCents = raw.goalMode === 'profit' ? money('targetProfit', raw.targetProfit, 'Target profit $') : 0;
  const taxBps = raw.taxEnabled ? pct('taxRate', raw.taxRate, 'Tax rate %') : 0;

  // Extra validations
  if (feePctBps >= 10000) {
    errors.push({ field: 'feePct', message: 'Fee % must be less than 100%' });
  }
  if (raw.goalMode === 'margin' && targetMarginBps >= 10000) {
    errors.push({ field: 'targetMargin', message: 'Target margin must be less than 100%' });
  }
  if (raw.taxEnabled && taxBps >= 10000) {
    errors.push({ field: 'taxRate', message: 'Tax rate must be less than 100%' });
  }

  const parsed: ParsedInputs = {
    currencySymbol: raw.currencySymbol || '$',
    materialsCents,
    packagingCents,
    laborMinutes,
    laborRateCents,
    overheadMode: raw.overheadMode,
    overheadBps,
    overheadFixedCents,
    feePctBps,
    feeFixedCents,
    shippingIncluded: raw.shippingIncluded,
    shippingCents,
    goalMode: raw.goalMode,
    targetMarginBps,
    targetProfitCents,
    roundingRule: raw.roundingRule,
    taxEnabled: raw.taxEnabled,
    taxBps,
  };

  return { parsed, errors };
}
