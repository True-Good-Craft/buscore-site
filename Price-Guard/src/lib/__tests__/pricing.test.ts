import { describe, it, expect } from 'vitest';
import { solveBreakEvenPrice, solveTargetPriceForProfit, solveTargetPriceForMargin } from '../pricing.js';
import type { ParsedInputs } from '../types.js';

function makeParsed(overrides: Partial<ParsedInputs> = {}): ParsedInputs {
  return {
    currencySymbol: '$',
    materialsCents: 0,
    packagingCents: 0,
    laborMinutes: 0,
    laborRateCents: 0,
    overheadMode: 'fixed',
    overheadBps: 0,
    overheadFixedCents: 0,
    feePctBps: 0,
    feeFixedCents: 0,
    shippingIncluded: false,
    shippingCents: 0,
    goalMode: 'margin',
    targetMarginBps: 0,
    targetProfitCents: 0,
    roundingRule: 'none',
    taxEnabled: false,
    taxBps: 0,
    ...overrides,
  };
}

describe('solveBreakEvenPrice', () => {
  it('Vector A: costs=1000, fee_pct=0, fee_fixed=0 -> 1000', () => {
    const p = makeParsed({ materialsCents: 1000 });
    expect(solveBreakEvenPrice(p, 1000)).toBe(1000);
  });

  it('Vector B: costs=1000, fee_pct=10% -> 1112', () => {
    const p = makeParsed({ materialsCents: 1000, feePctBps: 1000 });
    const result = solveBreakEvenPrice(p, 1000);
    // 1000/0.9 = 1111.11 -> 1112
    expect(result).toBe(1112);
    // verify profit >= 0
    const fee = Math.floor(result * 1000 / 10000 + 0.5);
    expect(result - 1000 - fee).toBeGreaterThanOrEqual(0);
  });

  it('Vector C: costs=1000, fee_pct=10%, fee_fixed=30 -> 1145', () => {
    const p = makeParsed({ materialsCents: 1000, feePctBps: 1000, feeFixedCents: 30 });
    const result = solveBreakEvenPrice(p, 1000);
    // (1030/0.9) = 1144.44 -> 1145
    expect(result).toBe(1145);
  });
});

describe('solveTargetPriceForProfit', () => {
  it('costs=1000, target_profit=0, fee_pct=0 -> 1000', () => {
    const p = makeParsed({ materialsCents: 1000, targetProfitCents: 0 });
    expect(solveTargetPriceForProfit(p, 1000)).toBe(1000);
  });
});

describe('solveTargetPriceForMargin', () => {
  it('cost=1000, fee=10%, margin=30% -> 1668', () => {
    // denom = 10000 - 1000 - 3000 = 6000
    // approx = ceil(1000 * 10000 / 6000) = ceil(1666.67) = 1667
    // 1667 fails check (500*10000 < 3000*1667), so increments to 1668
    const p = makeParsed({ feePctBps: 1000, targetMarginBps: 3000 });
    const result = solveTargetPriceForMargin(p, 1000);
    expect(result).toBe(1668);
    // verify margin >= 30%
    if (typeof result === 'number') {
      const fee = Math.floor(result * 1000 / 10000 + 0.5);
      const profit = result - 1000 - fee;
      expect(profit * 10000).toBeGreaterThanOrEqual(3000 * result);
    }
  });

  it('cost=1000, fee=10%, margin=30%, rounding=up_to_1_00 -> 1700', () => {
    // approx = ceil(1666.67) = 1667 -> rounded up to $17.00 = 1700
    // 1700 satisfies margin check
    const p = makeParsed({ feePctBps: 1000, targetMarginBps: 3000, roundingRule: 'up_to_1_00' });
    const result = solveTargetPriceForMargin(p, 1000);
    expect(result).toBe(1700);
  });

  it('returns impossible when fee + margin >= 100%', () => {
    const p = makeParsed({ feePctBps: 5000, targetMarginBps: 5000 });
    expect(solveTargetPriceForMargin(p, 1000)).toBe('impossible');
  });
});
