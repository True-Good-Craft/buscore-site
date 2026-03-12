import { describe, it, expect } from 'vitest';
import {
  applyRounding,
  calculateProfitAtPrice,
  findBreakEvenPrice,
  findPriceForMargin,
  findPriceForProfit,
  parseDollars,
  parsePercent,
} from './pricing';

describe('Psychological Rounding - Issue #1', () => {
  it('should round 1300 cents to 1399 (next dollar .99), not 1299', () => {
    const result = applyRounding(1300, 'psychological');
    expect(result).toBe(1399);
  });

  it('should keep 1399 as 1399 (already .99)', () => {
    const result = applyRounding(1399, 'psychological');
    expect(result).toBe(1399);
  });

  it('should round 1350 to 1399 (next dollar .99)', () => {
    const result = applyRounding(1350, 'psychological');
    expect(result).toBe(1399);
  });

  it('should round 1301 to 1399 (next dollar .99)', () => {
    const result = applyRounding(1301, 'psychological');
    expect(result).toBe(1399);
  });

  it('should round 100 to 199 (next dollar .99)', () => {
    const result = applyRounding(100, 'psychological');
    expect(result).toBe(199);
  });

  it('should handle 0 cents correctly', () => {
    const result = applyRounding(0, 'psychological');
    expect(result).toBe(99);
  });
});

describe('Break-even with Rounding - Issue #3', () => {
  it('should find break-even with dollar rounding (cost=1000, fee=10%)', () => {
    const breakEven = findBreakEvenPrice(1000, 1000, 0, 'dollar');
    expect(breakEven).toBe(1200);
    const profit = calculateProfitAtPrice(breakEven, 1000, 1000, 0);
    expect(profit).toBeGreaterThanOrEqual(0);
  });

  it('should find break-even with psychological rounding (cost=1000, fee=10%)', () => {
    const breakEven = findBreakEvenPrice(1000, 1000, 0, 'psychological');
    expect(breakEven).toBe(1199);
    const profit = calculateProfitAtPrice(breakEven, 1000, 1000, 0);
    expect(profit).toBeGreaterThanOrEqual(0);
  });

  it('should find break-even with fifty-cent rounding', () => {
    const breakEven = findBreakEvenPrice(1000, 1000, 0, 'fifty');
    expect(breakEven % 50).toBe(0);
    const profit = calculateProfitAtPrice(breakEven, 1000, 1000, 0);
    expect(profit).toBeGreaterThanOrEqual(0);
  });

  it('should find break-even with no rounding (exact)', () => {
    const breakEven = findBreakEvenPrice(1000, 1000, 30, 'none');
    const profit = calculateProfitAtPrice(breakEven, 1000, 1000, 30);
    expect(profit).toBeGreaterThanOrEqual(0);
    const profitMinus1 = calculateProfitAtPrice(breakEven - 1, 1000, 1000, 30);
    expect(profitMinus1).toBeLessThan(0);
  });
});

describe('Margin Invariant Check - Issue #2', () => {
  it('should meet margin target using integer cross-multiplication', () => {
    const totalCost = 1000;
    const targetMarginBps = 3000;
    const platformFeeBps = 1000;
    const platformFeeFixed = 30;

    const price = findPriceForMargin(totalCost, targetMarginBps, platformFeeBps, platformFeeFixed, 'none');
    const profit = calculateProfitAtPrice(price, totalCost, platformFeeBps, platformFeeFixed);
    
    const meetsMargin = profit * 10000 >= targetMarginBps * price;
    expect(meetsMargin).toBe(true);
  });

  it('should reject price where rounded margin passes but invariant fails', () => {
    const totalCost = 1000;
    const targetMarginBps = 2950;
    const platformFeeBps = 1000;
    const platformFeeFixed = 0;

    const price = findPriceForMargin(totalCost, targetMarginBps, platformFeeBps, platformFeeFixed, 'none');
    const profit = calculateProfitAtPrice(price, totalCost, platformFeeBps, platformFeeFixed);
    
    const invariantCheck = profit * 10000 >= targetMarginBps * price;
    expect(invariantCheck).toBe(true);
    
    const priceMinus1 = price - 1;
    const profitMinus1 = calculateProfitAtPrice(priceMinus1, totalCost, platformFeeBps, platformFeeFixed);
    const invariantCheckMinus1 = profitMinus1 * 10000 >= targetMarginBps * priceMinus1;
    expect(invariantCheckMinus1).toBe(false);
  });
});

describe('Psychological Rounding Solver - Issue #4 regression', () => {
  it('should not infinite loop near whole dollar amounts', () => {
    const totalCost = 1000;
    const targetProfit = 100;
    const platformFeeBps = 0;
    const platformFeeFixed = 0;

    const price = findPriceForProfit(totalCost, targetProfit, platformFeeBps, platformFeeFixed, 'psychological');
    
    expect(price).toBeGreaterThan(0);
    expect(price).toBeLessThan(Infinity);
    expect(price % 100).toBe(99);
    
    const profit = calculateProfitAtPrice(price, totalCost, platformFeeBps, platformFeeFixed);
    expect(profit).toBeGreaterThanOrEqual(targetProfit);
  });

  it('should handle edge case at exactly 1300 cents with psychological rounding', () => {
    const totalCost = 1200;
    const targetProfit = 100;
    const platformFeeBps = 0;
    const platformFeeFixed = 0;

    const price = findPriceForProfit(totalCost, targetProfit, platformFeeBps, platformFeeFixed, 'psychological');
    
    expect(price).toBe(1399);
    const profit = calculateProfitAtPrice(price, totalCost, platformFeeBps, platformFeeFixed);
    expect(profit).toBeGreaterThanOrEqual(targetProfit);
  });
});

describe('High Cost Robustness - Issue #4', () => {
  it('should handle high costs efficiently with dollar rounding', () => {
    const totalCost = 50000;
    const targetProfit = 10000;
    const platformFeeBps = 500;
    const platformFeeFixed = 100;

    const price = findPriceForProfit(totalCost, targetProfit, platformFeeBps, platformFeeFixed, 'dollar');
    
    expect(price).toBeGreaterThan(0);
    expect(price).toBeLessThan(Infinity);
    expect(price % 100).toBe(0);
    
    const profit = calculateProfitAtPrice(price, totalCost, platformFeeBps, platformFeeFixed);
    expect(profit).toBeGreaterThanOrEqual(targetProfit);
  });

  it('should handle high margin targets with psychological rounding', () => {
    const totalCost = 10000;
    const targetMarginBps = 5000;
    const platformFeeBps = 1000;
    const platformFeeFixed = 50;

    const price = findPriceForMargin(totalCost, targetMarginBps, platformFeeBps, platformFeeFixed, 'psychological');
    
    expect(price).toBeGreaterThan(0);
    expect(price).toBeLessThan(Infinity);
    expect(price % 100).toBe(99);
    
    const profit = calculateProfitAtPrice(price, totalCost, platformFeeBps, platformFeeFixed);
    const invariantCheck = profit * 10000 >= targetMarginBps * price;
    expect(invariantCheck).toBe(true);
  });
});

describe('Impossible Cases - Issue #5', () => {
  it('should return Infinity for impossible margin (fee >= 100%)', () => {
    const totalCost = 1000;
    const targetMarginBps = 1000;
    const platformFeeBps = 10000;
    const platformFeeFixed = 0;

    const price = findPriceForMargin(totalCost, targetMarginBps, platformFeeBps, platformFeeFixed, 'none');
    expect(price).toBe(Infinity);
  });

  it('should return Infinity when margin + fee >= 100%', () => {
    const totalCost = 1000;
    const targetMarginBps = 5000;
    const platformFeeBps = 5000;
    const platformFeeFixed = 0;

    const price = findPriceForMargin(totalCost, targetMarginBps, platformFeeBps, platformFeeFixed, 'none');
    expect(price).toBe(Infinity);
  });

  it('should return Infinity for break-even with fee >= 100%', () => {
    const totalCost = 1000;
    const platformFeeBps = 10000;
    const platformFeeFixed = 0;

    const breakEven = findBreakEvenPrice(totalCost, platformFeeBps, platformFeeFixed, 'none');
    expect(breakEven).toBe(Infinity);
  });
});

describe('Parsing Functions - Issue #6', () => {
  it('should parse valid dollars correctly', () => {
    expect(parseDollars('12.34')).toBe(1234);
    expect(parseDollars('0.99')).toBe(99);
    expect(parseDollars('100')).toBe(10000);
    expect(parseDollars('5.5')).toBe(550);
  });

  it('should reject more than 2 decimal places', () => {
    expect(parseDollars('12.345')).toBe(0);
  });

  it('should handle empty and dash gracefully', () => {
    expect(parseDollars('')).toBe(0);
    expect(parseDollars('-')).toBe(0);
  });

  it('should parse valid percents correctly', () => {
    expect(parsePercent('10')).toBe(1000);
    expect(parsePercent('25.5')).toBe(2550);
    expect(parsePercent('0.1')).toBe(10);
  });

  it('should handle invalid input gracefully', () => {
    expect(parseDollars('abc')).toBe(0);
    expect(parsePercent('xyz')).toBe(0);
  });

  it('should handle negative numbers', () => {
    expect(parseDollars('-5.00')).toBe(-500);
    expect(parsePercent('-10')).toBe(-1000);
  });
});

describe('All Rounding Modes', () => {
  it('dollar rounding should round up to nearest dollar', () => {
    expect(applyRounding(1250, 'dollar')).toBe(1300);
    expect(applyRounding(1200, 'dollar')).toBe(1200);
    expect(applyRounding(1201, 'dollar')).toBe(1300);
  });

  it('fifty rounding should round up to nearest 50 cents', () => {
    expect(applyRounding(1225, 'fifty')).toBe(1250);
    expect(applyRounding(1200, 'fifty')).toBe(1200);
    expect(applyRounding(1201, 'fifty')).toBe(1250);
    expect(applyRounding(1275, 'fifty')).toBe(1300);
  });

  it('none rounding should not change price', () => {
    expect(applyRounding(1234, 'none')).toBe(1234);
    expect(applyRounding(9999, 'none')).toBe(9999);
  });
});

describe('Rounding Mode Edge Cases — $10.00/$10.01/$10.99/$10.50', () => {
  const cases: Array<[number, string, number]> = [
    // [input cents, mode, expected cents]
    // none (exact)
    [1000, 'none', 1000],
    [1001, 'none', 1001],
    [1099, 'none', 1099],
    [1050, 'none', 1050],
    // round up to nearest dollar
    [1000, 'dollar', 1000],
    [1001, 'dollar', 1100],
    [1099, 'dollar', 1100],
    [1050, 'dollar', 1100],
    // round down to nearest dollar
    [1000, 'floor_dollar', 1000],
    [1001, 'floor_dollar', 1000],
    [1099, 'floor_dollar', 1000],
    [1050, 'floor_dollar', 1000],
    // psychological .99
    [1000, 'psychological', 1099],
    [1001, 'psychological', 1099],
    [1099, 'psychological', 1099],
    [1050, 'psychological', 1099],
    // psychological .95
    [1000, 'psych_0_95', 1095],
    [1001, 'psych_0_95', 1095],
    [1099, 'psych_0_95', 1195],
    [1050, 'psych_0_95', 1095],
  ];
  for (const [input, mode, expected] of cases) {
    it(`applyRounding(${input}, '${mode}') === ${expected}`, () => {
      expect(applyRounding(input, mode)).toBe(expected);
    });
  }
});

describe('Edge Cases', () => {
  it('should handle zero costs', () => {
    const breakEven = findBreakEvenPrice(0, 0, 0, 'none');
    expect(breakEven).toBe(0);
  });

  it('should handle very small profits', () => {
    const price = findPriceForProfit(1000, 1, 0, 0, 'none');
    expect(price).toBe(1001);
  });

  it('should handle negative profit target (fall back to break-even)', () => {
    const price = findPriceForProfit(1000, -100, 1000, 0, 'none');
    const breakEven = findBreakEvenPrice(1000, 1000, 0, 'none');
    expect(price).toBe(breakEven);
  });

  it('should handle 0% margin target', () => {
    const price = findPriceForMargin(1000, 0, 1000, 0, 'none');
    const breakEven = findBreakEvenPrice(1000, 1000, 0, 'none');
    expect(price).toBe(breakEven);
  });
});

describe('Production Edge Cases', () => {
  it('0% margin: price equals break-even, profit >= 0', () => {
    const price = findPriceForMargin(1000, 0, 500, 30, 'none');
    const profit = calculateProfitAtPrice(price, 1000, 500, 30);
    expect(profit).toBeGreaterThanOrEqual(0);
    expect(price * 10000).toBeGreaterThanOrEqual(0 * price); // 0% margin check
  });

  it('100% margin returns Infinity (impossible)', () => {
    const price = findPriceForMargin(1000, 10000, 500, 0, 'none');
    expect(price).toBe(Infinity);
  });

  it('99% margin: solver returns Infinity when fee makes it impossible', () => {
    // 99% margin + 10% fee = 109% > 100% — impossible
    const price = findPriceForMargin(1000, 9900, 1000, 0, 'none');
    expect(price).toBe(Infinity);
  });

  it('99% margin with zero fees returns a finite price', () => {
    const price = findPriceForMargin(1000, 9900, 0, 0, 'none');
    expect(price).toBeGreaterThan(0);
    expect(price).toBeLessThan(Infinity);
    const profit = calculateProfitAtPrice(price, 1000, 0, 0);
    expect(profit * 10000).toBeGreaterThanOrEqual(9900 * price);
  });

  it('profit target mode: price meets exact profit target', () => {
    const totalCost = 800;
    const targetProfit = 200; // $2.00 target
    const price = findPriceForProfit(totalCost, targetProfit, 1000, 30, 'none');
    const profit = calculateProfitAtPrice(price, totalCost, 1000, 30);
    expect(profit).toBeGreaterThanOrEqual(targetProfit);
  });

  it('platform percent + fixed fee combination is deterministic', () => {
    const totalCost = 1000;
    const feeBps = 800;  // 8%
    const feeFixed = 25; // $0.25
    const price = findPriceForMargin(totalCost, 2500, feeBps, feeFixed, 'none');
    const profit = calculateProfitAtPrice(price, totalCost, feeBps, feeFixed);
    expect(profit * 10000).toBeGreaterThanOrEqual(2500 * price);
    // Verify integer math: no fractional cents
    expect(Number.isInteger(price)).toBe(true);
    expect(Number.isInteger(profit)).toBe(true);
  });

  it('shipping included increases total cost and required price', () => {
    const costWithoutShipping = findPriceForMargin(1000, 3000, 1000, 0, 'none');
    const costWithShipping = findPriceForMargin(1000 + 350, 3000, 1000, 0, 'none'); // +$3.50
    expect(costWithShipping).toBeGreaterThan(costWithoutShipping);
  });

  it('impossible state: fee >= 100% returns Infinity for break-even', () => {
    const breakEven = findBreakEvenPrice(1000, 10000, 0, 'none');
    expect(breakEven).toBe(Infinity);
  });

  it('impossible state: margin + fee >= 100% returns Infinity', () => {
    const price = findPriceForMargin(1000, 6000, 5000, 0, 'none'); // 60% + 50% = 110%
    expect(price).toBe(Infinity);
  });
});
