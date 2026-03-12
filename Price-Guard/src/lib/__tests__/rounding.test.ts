import { describe, it, expect } from 'vitest';
import { applyRoundingRule, nextRoundedPrice } from '../rounding.js';

describe('applyRoundingRule', () => {
  it('1234 -> up_to_1_00 = 1300', () => expect(applyRoundingRule(1234, 'up_to_1_00')).toBe(1300));
  it('1234 -> up_to_0_50 = 1250', () => expect(applyRoundingRule(1234, 'up_to_0_50')).toBe(1250));
  it('1200 -> psych_0_99 = 1299', () => expect(applyRoundingRule(1200, 'psych_0_99')).toBe(1299));
  it('1299 -> psych_0_99 = 1299 (already .99)', () => expect(applyRoundingRule(1299, 'psych_0_99')).toBe(1299));
  it('1234 -> none = 1234', () => expect(applyRoundingRule(1234, 'none')).toBe(1234));

  // psych_0_95
  it('1300 -> psych_0_95 = 1395', () => expect(applyRoundingRule(1300, 'psych_0_95')).toBe(1395));
  it('1295 -> psych_0_95 = 1295 (already .95)', () => expect(applyRoundingRule(1295, 'psych_0_95')).toBe(1295));
  it('1250 -> psych_0_95 = 1295', () => expect(applyRoundingRule(1250, 'psych_0_95')).toBe(1295));
  it('1296 -> psych_0_95 = 1395 (remainder > 95)', () => expect(applyRoundingRule(1296, 'psych_0_95')).toBe(1395));
  it('100 -> psych_0_95 = 195', () => expect(applyRoundingRule(100, 'psych_0_95')).toBe(195));

  // ceil_dollar
  it('1234 -> ceil_dollar = 1300', () => expect(applyRoundingRule(1234, 'ceil_dollar')).toBe(1300));
  it('1300 -> ceil_dollar = 1300 (exact dollar)', () => expect(applyRoundingRule(1300, 'ceil_dollar')).toBe(1300));
  it('1201 -> ceil_dollar = 1300', () => expect(applyRoundingRule(1201, 'ceil_dollar')).toBe(1300));

  // floor_dollar
  it('1234 -> floor_dollar = 1200', () => expect(applyRoundingRule(1234, 'floor_dollar')).toBe(1200));
  it('1300 -> floor_dollar = 1300 (exact dollar)', () => expect(applyRoundingRule(1300, 'floor_dollar')).toBe(1300));
  it('1299 -> floor_dollar = 1200', () => expect(applyRoundingRule(1299, 'floor_dollar')).toBe(1200));
});

describe('nextRoundedPrice', () => {
  it('psych_0_95: increments by 100', () => expect(nextRoundedPrice(1395, 'psych_0_95')).toBe(1495));
  it('ceil_dollar: increments by 100', () => expect(nextRoundedPrice(1300, 'ceil_dollar')).toBe(1400));
  it('floor_dollar: increments by 100', () => expect(nextRoundedPrice(1200, 'floor_dollar')).toBe(1300));
});
