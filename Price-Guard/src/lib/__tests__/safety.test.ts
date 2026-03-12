import { describe, it, expect } from 'vitest';
import { getSafetyIndicator, computeBreakdownAtPrice } from '../pricing.js';

describe('getSafetyIndicator', () => {
  it('returns LOSS when profit < 0', () => {
    const result = getSafetyIndicator(-100, -500, 1000, 1100, 3000);
    expect(result.level).toBe('LOSS');
    expect(result.message).toBe('Loss detected — You are selling below cost.');
  });

  it('returns LOSS when price <= break-even', () => {
    // profit is 0 but price equals break-even
    const result = getSafetyIndicator(0, 0, 1000, 1000, 3000);
    expect(result.level).toBe('LOSS');
  });

  it('returns LOSS when price < break-even', () => {
    const result = getSafetyIndicator(10, 100, 900, 1000, 3000);
    expect(result.level).toBe('LOSS');
  });

  it('returns LOW_MARGIN when margin < 10%', () => {
    // margin = 500 bps = 5%
    const result = getSafetyIndicator(50, 500, 1100, 1000, 3000);
    expect(result.level).toBe('LOW_MARGIN');
    expect(result.message).toBe('Low margin — Risk of underpricing.');
  });

  it('returns OK when margin >= target', () => {
    // margin = 3100 bps = 31%, target = 3000 bps = 30%
    const result = getSafetyIndicator(310, 3100, 1100, 1000, 3000);
    expect(result.level).toBe('OK');
    expect(result.message).toBe('Margin target achieved.');
  });

  it('returns OK when no target (reverse mode, target=0) and margin >= 10%', () => {
    const result = getSafetyIndicator(150, 1500, 1100, 1000, 0);
    expect(result.level).toBe('OK');
  });

  it('returns LOW_MARGIN when margin below target by more than 0.25%', () => {
    // margin = 2900 bps, target = 3000, diff = 100 bps > 25 bps
    const result = getSafetyIndicator(290, 2900, 1100, 1000, 3000);
    expect(result.level).toBe('LOW_MARGIN');
  });

  it('returns OK when margin within 0.25% of target', () => {
    // margin = 2980 bps, target = 3000, diff = 20 bps <= 25 bps
    const result = getSafetyIndicator(298, 2980, 1100, 1000, 3000);
    expect(result.level).toBe('OK');
  });
});

describe('computeBreakdownAtPrice (reverse mode)', () => {
  it('computes correct fees, net revenue, and profit', () => {
    // price=2000, cost=1000, fee%=10% (1000bps), fixed=30
    const bd = computeBreakdownAtPrice(2000, 1000, 1000, 30, {
      materialsCents: 500,
      packagingCents: 200,
      laborCents: 200,
      overheadCents: 100,
      shippingCents: 0,
    });
    expect(bd.priceCents).toBe(2000);
    // fee% = round_half_up(2000*1000/10000) = 200
    expect(bd.platformFeePercentCents).toBe(200);
    expect(bd.platformFeeFixedCents).toBe(30);
    expect(bd.totalFeesCents).toBe(230);
    expect(bd.netRevenueCents).toBe(1770);
    expect(bd.profitCents).toBe(770); // 1770 - 1000
  });

  it('correctly propagates breakdown line items', () => {
    const bd = computeBreakdownAtPrice(1500, 800, 500, 0, {
      materialsCents: 300,
      packagingCents: 200,
      laborCents: 200,
      overheadCents: 100,
      shippingCents: 0,
    });
    expect(bd.materialsCents).toBe(300);
    expect(bd.packagingCents).toBe(200);
    expect(bd.laborCents).toBe(200);
    expect(bd.overheadCents).toBe(100);
    expect(bd.totalCostCents).toBe(800);
  });

  it('handles zero fees', () => {
    const bd = computeBreakdownAtPrice(1500, 800, 0, 0, {
      materialsCents: 800,
      packagingCents: 0,
      laborCents: 0,
      overheadCents: 0,
      shippingCents: 0,
    });
    expect(bd.totalFeesCents).toBe(0);
    expect(bd.netRevenueCents).toBe(1500);
    expect(bd.profitCents).toBe(700);
  });
});
