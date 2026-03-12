import { describe, it, expect } from 'vitest';
import { parseMoneyToCents, parsePercentToBps } from '../money.js';

describe('parseMoneyToCents', () => {
  it('"0" -> 0', () => expect(parseMoneyToCents('0')).toBe(0));
  it('"12" -> 1200', () => expect(parseMoneyToCents('12')).toBe(1200));
  it('"12.3" -> 1230', () => expect(parseMoneyToCents('12.3')).toBe(1230));
  it('"12.34" -> 1234', () => expect(parseMoneyToCents('12.34')).toBe(1234));
  it('"12.345" -> error', () => expect(parseMoneyToCents('12.345')).toBeNull());
  it('"-1" -> error', () => expect(parseMoneyToCents('-1')).toBeNull());
  it('empty -> error', () => expect(parseMoneyToCents('')).toBeNull());
  it('"abc" -> error', () => expect(parseMoneyToCents('abc')).toBeNull());
});

describe('parsePercentToBps', () => {
  it('"6.5" -> 650', () => expect(parsePercentToBps('6.5')).toBe(650));
  it('"10" -> 1000', () => expect(parsePercentToBps('10')).toBe(1000));
  it('"0" -> 0', () => expect(parsePercentToBps('0')).toBe(0));
  it('empty -> error', () => expect(parsePercentToBps('')).toBeNull());
});
