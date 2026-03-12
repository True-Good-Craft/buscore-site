import { RoundingRule } from './types.js';

/** Apply rounding rule to a price in cents. Returns rounded price >= input price. */
export function applyRoundingRule(priceCents: number, rule: RoundingRule): number {
  switch (rule) {
    case 'none':
      return priceCents;
    case 'up_to_1_00':
    case 'ceil_dollar':
      return Math.ceil(priceCents / 100) * 100;
    case 'up_to_0_50':
      return Math.ceil(priceCents / 50) * 50;
    case 'psych_0_99': {
      const remainder = priceCents % 100;
      if (remainder === 99) return priceCents;
      if (remainder === 0) return priceCents + 99;
      return Math.ceil(priceCents / 100) * 100 - 1;
    }
    case 'psych_0_95': {
      const remainder = priceCents % 100;
      if (remainder === 95) return priceCents;
      if (remainder < 95) return Math.floor(priceCents / 100) * 100 + 95;
      return (Math.floor(priceCents / 100) + 1) * 100 + 95;
    }
    case 'floor_dollar':
      return Math.floor(priceCents / 100) * 100;
  }
}

/** Return the next valid rounded price after the current one */
export function nextRoundedPrice(current: number, rule: RoundingRule): number {
  switch (rule) {
    case 'none':
      return current + 1;
    case 'up_to_1_00':
    case 'ceil_dollar':
      return current + 100;
    case 'up_to_0_50':
      return current + 50;
    case 'psych_0_99':
    case 'psych_0_95':
    case 'floor_dollar':
      return current + 100;
  }
}
