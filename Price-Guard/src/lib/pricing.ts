export interface PricingInputs {
  materialsCents: number;
  packagingCents: number;
  laborMinutes: number;
  laborRateCentsPerHour: number;
  overheadMode: 'percent' | 'fixed';
  overheadBps: number;
  overheadCents: number;
  platformFeeBps: number;
  platformFeeFixedCents: number;
  shippingIncluded: boolean;
  shippingCents: number;
  goalMode: 'margin' | 'profit';
  targetMarginBps: number;
  targetProfitCents: number;
  roundingMode: 'none' | 'dollar' | 'fifty' | 'psychological' | 'psych_0_95' | 'ceil_dollar' | 'floor_dollar';
}

export interface PricingResults {
  breakEvenCents: number;
  recommendedPriceCents: number;
  profitCents: number;
  marginBps: number;
  breakdown: CostBreakdown;
  isImpossible: boolean;
  impossibleReason?: string;
}

export interface CostBreakdown {
  materialsCents: number;
  packagingCents: number;
  laborCents: number;
  overheadCents: number;
  shippingCents: number;
  totalCostCents: number;
  priceCents: number;
  platformFeePercentCents: number;
  platformFeeFixedCents: number;
  totalFeesCents: number;
  netRevenueCents: number;
  profitCents: number;
}

function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

export function calculateLaborCents(minutes: number, rateCentsPerHour: number): number {
  if (minutes === 0 || rateCentsPerHour === 0) return 0;
  return roundHalfUp((minutes * rateCentsPerHour) / 60);
}

export function calculateOverheadCents(
  mode: 'percent' | 'fixed',
  bps: number,
  fixedCents: number,
  baseCostCents: number
): number {
  if (mode === 'fixed') return fixedCents;
  return roundHalfUp((baseCostCents * bps) / 10000);
}

export function calculatePlatformFeePercentCents(priceCents: number, feeBps: number): number {
  return roundHalfUp((priceCents * feeBps) / 10000);
}

export function calculateTotalCostCents(
  materialsCents: number,
  packagingCents: number,
  laborCents: number,
  overheadCents: number,
  shippingCents: number
): number {
  return materialsCents + packagingCents + laborCents + overheadCents + shippingCents;
}

export function calculateProfitAtPrice(
  priceCents: number,
  totalCostCents: number,
  platformFeeBps: number,
  platformFeeFixedCents: number
): number {
  const feePercentCents = calculatePlatformFeePercentCents(priceCents, platformFeeBps);
  return priceCents - totalCostCents - platformFeeFixedCents - feePercentCents;
}

export function calculateMarginBps(profitCents: number, priceCents: number): number {
  if (priceCents === 0) return 0;
  return roundHalfUp((profitCents * 10000) / priceCents);
}

export function applyRounding(priceCents: number, mode: string): number {
  switch (mode) {
    case 'dollar':
    case 'ceil_dollar':
      return Math.ceil(priceCents / 100) * 100;
    case 'fifty':
      return Math.ceil(priceCents / 50) * 50;
    case 'psychological': {
      if (priceCents % 100 === 99) return priceCents;
      const dollars = Math.floor(priceCents / 100) + 1;
      return dollars * 100 - 1;
    }
    case 'psych_0_95': {
      const remainder = priceCents % 100;
      if (remainder === 95) return priceCents;
      if (remainder < 95) return Math.floor(priceCents / 100) * 100 + 95;
      return (Math.floor(priceCents / 100) + 1) * 100 + 95;
    }
    case 'floor_dollar':
      return Math.floor(priceCents / 100) * 100;
    default:
      return priceCents;
  }
}

function nextCandidate(priceCents: number, roundingMode: string): number {
  switch (roundingMode) {
    case 'none':
      return priceCents + 1;
    case 'fifty':
      return Math.floor((priceCents + 50) / 50) * 50;
    case 'dollar':
    case 'ceil_dollar':
      return (Math.floor(priceCents / 100) + 1) * 100;
    case 'psychological': {
      const dollars = Math.floor(priceCents / 100) + 1;
      return dollars * 100 + 99;
    }
    case 'psych_0_95': {
      const dollars = Math.floor(priceCents / 100) + 1;
      return dollars * 100 + 95;
    }
    case 'floor_dollar':
      return (Math.floor(priceCents / 100) + 1) * 100;
    default:
      return priceCents + 1;
  }
}

function meetsProfit(profitCents: number, targetProfitCents: number): boolean {
  return profitCents >= targetProfitCents;
}

function meetsMargin(profitCents: number, priceCents: number, targetMarginBps: number): boolean {
  return profitCents * 10000 >= targetMarginBps * priceCents;
}

export function findBreakEvenPrice(
  totalCostCents: number,
  platformFeeBps: number,
  platformFeeFixedCents: number,
  roundingMode: string
): number {
  const fixedCosts = totalCostCents + platformFeeFixedCents;
  const feeRateDecimal = platformFeeBps / 10000;
  
  if (feeRateDecimal >= 1) {
    return Infinity;
  }
  
  const approximatePrice = fixedCosts / (1 - feeRateDecimal);
  let candidate = applyRounding(Math.ceil(approximatePrice), roundingMode);
  
  for (let i = 0; i < 10000; i++) {
    const profit = calculateProfitAtPrice(candidate, totalCostCents, platformFeeBps, platformFeeFixedCents);
    if (profit >= 0) {
      return candidate;
    }
    candidate = nextCandidate(candidate, roundingMode);
  }
  
  return Infinity;
}

export function findPriceForMargin(
  totalCostCents: number,
  targetMarginBps: number,
  platformFeeBps: number,
  platformFeeFixedCents: number,
  roundingMode: string
): number {
  if (targetMarginBps >= 10000) {
    return Infinity;
  }
  
  if (targetMarginBps < 0) {
    return findBreakEvenPrice(totalCostCents, platformFeeBps, platformFeeFixedCents, roundingMode);
  }
  
  const fixedCosts = totalCostCents + platformFeeFixedCents;
  const targetMarginDecimal = targetMarginBps / 10000;
  const feeRateDecimal = platformFeeBps / 10000;
  
  const denominator = 1 - targetMarginDecimal - feeRateDecimal;
  if (denominator <= 0) {
    return Infinity;
  }
  
  const approximatePrice = fixedCosts / denominator;
  let candidate = applyRounding(Math.ceil(approximatePrice), roundingMode);
  
  for (let i = 0; i < 10000; i++) {
    const profit = calculateProfitAtPrice(candidate, totalCostCents, platformFeeBps, platformFeeFixedCents);
    
    if (meetsMargin(profit, candidate, targetMarginBps)) {
      return candidate;
    }
    
    candidate = nextCandidate(candidate, roundingMode);
  }
  
  return Infinity;
}

export function findPriceForProfit(
  totalCostCents: number,
  targetProfitCents: number,
  platformFeeBps: number,
  platformFeeFixedCents: number,
  roundingMode: string
): number {
  if (targetProfitCents < 0) {
    return findBreakEvenPrice(totalCostCents, platformFeeBps, platformFeeFixedCents, roundingMode);
  }
  
  const fixedCosts = totalCostCents + platformFeeFixedCents;
  const feeRateDecimal = platformFeeBps / 10000;
  
  if (feeRateDecimal >= 1) {
    return Infinity;
  }
  
  const approximatePrice = (fixedCosts + targetProfitCents) / (1 - feeRateDecimal);
  let candidate = applyRounding(Math.ceil(approximatePrice), roundingMode);
  
  for (let i = 0; i < 10000; i++) {
    const profit = calculateProfitAtPrice(candidate, totalCostCents, platformFeeBps, platformFeeFixedCents);
    
    if (meetsProfit(profit, targetProfitCents)) {
      return candidate;
    }
    
    candidate = nextCandidate(candidate, roundingMode);
  }
  
  return Infinity;
}

export function calculatePricing(inputs: PricingInputs): PricingResults {
  const laborCents = calculateLaborCents(inputs.laborMinutes, inputs.laborRateCentsPerHour);
  const baseCostCents = inputs.materialsCents + inputs.packagingCents + laborCents;
  const overheadCents = calculateOverheadCents(
    inputs.overheadMode,
    inputs.overheadBps,
    inputs.overheadCents,
    baseCostCents
  );
  const shippingCents = inputs.shippingIncluded ? inputs.shippingCents : 0;
  const totalCostCents = calculateTotalCostCents(
    inputs.materialsCents,
    inputs.packagingCents,
    laborCents,
    overheadCents,
    shippingCents
  );
  
  const breakEvenCents = findBreakEvenPrice(
    totalCostCents,
    inputs.platformFeeBps,
    inputs.platformFeeFixedCents,
    inputs.roundingMode
  );
  
  let recommendedPriceCents: number;
  if (inputs.goalMode === 'margin') {
    recommendedPriceCents = findPriceForMargin(
      totalCostCents,
      inputs.targetMarginBps,
      inputs.platformFeeBps,
      inputs.platformFeeFixedCents,
      inputs.roundingMode
    );
  } else {
    recommendedPriceCents = findPriceForProfit(
      totalCostCents,
      inputs.targetProfitCents,
      inputs.platformFeeBps,
      inputs.platformFeeFixedCents,
      inputs.roundingMode
    );
  }
  
  const isImpossible = !isFinite(breakEvenCents) || !isFinite(recommendedPriceCents);
  
  let impossibleReason: string | undefined;
  if (!isFinite(breakEvenCents)) {
    impossibleReason = 'Platform fee structure makes any positive price impossible (fee rate >= 100%)';
  } else if (!isFinite(recommendedPriceCents)) {
    if (inputs.goalMode === 'margin') {
      if (inputs.targetMarginBps >= 10000) {
        impossibleReason = 'Target margin of 100% or more is impossible';
      } else {
        impossibleReason = 'Target margin too high given the cost structure and platform fees';
      }
    } else {
      impossibleReason = 'Target profit too high given the cost structure and platform fees';
    }
  }
  
  if (isImpossible) {
    const safePriceCents = isFinite(breakEvenCents) ? breakEvenCents : 0;
    const safeProfit = isFinite(breakEvenCents) 
      ? calculateProfitAtPrice(breakEvenCents, totalCostCents, inputs.platformFeeBps, inputs.platformFeeFixedCents)
      : 0;
    const safeMargin = isFinite(breakEvenCents) ? calculateMarginBps(safeProfit, breakEvenCents) : 0;
    const safePlatformFeePercent = isFinite(breakEvenCents) 
      ? calculatePlatformFeePercentCents(breakEvenCents, inputs.platformFeeBps)
      : 0;
    const safeTotalFees = safePlatformFeePercent + inputs.platformFeeFixedCents;
    const safeNetRevenue = safePriceCents - safeTotalFees;

    return {
      breakEvenCents: safePriceCents,
      recommendedPriceCents: safePriceCents,
      profitCents: safeProfit,
      marginBps: safeMargin,
      breakdown: {
        materialsCents: inputs.materialsCents,
        packagingCents: inputs.packagingCents,
        laborCents,
        overheadCents,
        shippingCents,
        totalCostCents,
        priceCents: safePriceCents,
        platformFeePercentCents: safePlatformFeePercent,
        platformFeeFixedCents: inputs.platformFeeFixedCents,
        totalFeesCents: safeTotalFees,
        netRevenueCents: safeNetRevenue,
        profitCents: safeProfit
      },
      isImpossible: true,
      impossibleReason
    };
  }
  
  const finalPrice = recommendedPriceCents;
  const profitCents = calculateProfitAtPrice(
    finalPrice,
    totalCostCents,
    inputs.platformFeeBps,
    inputs.platformFeeFixedCents
  );
  const marginBps = calculateMarginBps(profitCents, finalPrice);
  
  const platformFeePercentCents = calculatePlatformFeePercentCents(finalPrice, inputs.platformFeeBps);
  const totalFeesCents = platformFeePercentCents + inputs.platformFeeFixedCents;
  const netRevenueCents = finalPrice - totalFeesCents;
  
  const breakdown: CostBreakdown = {
    materialsCents: inputs.materialsCents,
    packagingCents: inputs.packagingCents,
    laborCents,
    overheadCents,
    shippingCents,
    totalCostCents,
    priceCents: finalPrice,
    platformFeePercentCents,
    platformFeeFixedCents: inputs.platformFeeFixedCents,
    totalFeesCents,
    netRevenueCents,
    profitCents
  };
  
  return {
    breakEvenCents,
    recommendedPriceCents,
    profitCents,
    marginBps,
    breakdown,
    isImpossible: false,
    impossibleReason: undefined
  };
}

export function formatCents(cents: number): string {
  const dollars = cents / 100;
  return dollars.toFixed(2);
}

export function formatBps(bps: number): string {
  const percent = bps / 100;
  return percent.toFixed(2);
}

export function parseDollars(value: string): number {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '-') return 0;
  
  const decimalMatch = trimmed.match(/^-?\d+(\.\d{1,2})?$/);
  if (!decimalMatch) {
    console.warn(`Invalid dollar input: "${value}" - using 0`);
    return 0;
  }
  
  const parsed = parseFloat(trimmed);
  if (isNaN(parsed)) {
    console.warn(`Invalid dollar input: "${value}" - using 0`);
    return 0;
  }
  
  return Math.round(parsed * 100);
}

export function parsePercent(value: string): number {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '-') return 0;
  
  const parsed = parseFloat(trimmed);
  if (isNaN(parsed)) {
    console.warn(`Invalid percent input: "${value}" - using 0`);
    return 0;
  }
  
  return Math.round(parsed * 100);
}

// ---------------------------------------------------------------------------
// Canonical SOT-aligned solver functions (use ParsedInputs + RoundingRule)
// ---------------------------------------------------------------------------

import { applyRoundingRule, nextRoundedPrice } from './rounding.js';
import type { ParsedInputs } from './types.js';

function _roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

function _feePctAmount(priceCents: number, feePctBps: number): number {
  return _roundHalfUp((priceCents * feePctBps) / 10000);
}

function _profitAt(priceCents: number, totalCostCents: number, feePctBps: number, feeFixedCents: number): number {
  return priceCents - totalCostCents - feeFixedCents - _feePctAmount(priceCents, feePctBps);
}

function _meetsMargin(profitCents: number, priceCents: number, targetMarginBps: number): boolean {
  return profitCents * 10000 >= targetMarginBps * priceCents;
}

export function solveBreakEvenPrice(inputs: ParsedInputs, totalCostCents: number): number {
  const { feePctBps, feeFixedCents, roundingRule } = inputs;
  const feeRate = feePctBps / 10000;
  if (feeRate >= 1) return Infinity;
  const approx = (totalCostCents + feeFixedCents) / (1 - feeRate);
  let candidate = applyRoundingRule(Math.ceil(approx), roundingRule);
  for (let i = 0; i < 10000; i++) {
    if (_profitAt(candidate, totalCostCents, feePctBps, feeFixedCents) >= 0) return candidate;
    candidate = nextRoundedPrice(candidate, roundingRule);
  }
  return Infinity;
}

export function solveTargetPriceForProfit(inputs: ParsedInputs, totalCostCents: number): number {
  const { feePctBps, feeFixedCents, targetProfitCents, roundingRule } = inputs;
  if (targetProfitCents < 0) return solveBreakEvenPrice(inputs, totalCostCents);
  const feeRate = feePctBps / 10000;
  if (feeRate >= 1) return Infinity;
  const approx = (totalCostCents + feeFixedCents + targetProfitCents) / (1 - feeRate);
  let candidate = applyRoundingRule(Math.ceil(approx), roundingRule);
  for (let i = 0; i < 10000; i++) {
    if (_profitAt(candidate, totalCostCents, feePctBps, feeFixedCents) >= targetProfitCents) return candidate;
    candidate = nextRoundedPrice(candidate, roundingRule);
  }
  return Infinity;
}

export function solveTargetPriceForMargin(inputs: ParsedInputs, totalCostCents: number): number | 'impossible' {
  const { feePctBps, feeFixedCents, targetMarginBps, roundingRule } = inputs;
  if (targetMarginBps >= 10000) return 'impossible';
  const denom = 10000 - feePctBps - targetMarginBps;
  if (denom <= 0) return 'impossible';
  const approx = ((totalCostCents + feeFixedCents) * 10000) / denom;
  let candidate = applyRoundingRule(Math.ceil(approx), roundingRule);
  for (let i = 0; i < 10000; i++) {
    const profit = _profitAt(candidate, totalCostCents, feePctBps, feeFixedCents);
    if (_meetsMargin(profit, candidate, targetMarginBps)) return candidate;
    candidate = nextRoundedPrice(candidate, roundingRule);
  }
  return 'impossible';
}

/** Compute a full breakdown at an arbitrary sale price (used for reverse mode). */
export function computeBreakdownAtPrice(
  priceCents: number,
  totalCostCents: number,
  platformFeeBps: number,
  platformFeeFixedCents: number,
  breakdown: { materialsCents: number; packagingCents: number; laborCents: number; overheadCents: number; shippingCents: number }
): CostBreakdown {
  const platformFeePercentCents = calculatePlatformFeePercentCents(priceCents, platformFeeBps);
  const totalFeesCents = platformFeePercentCents + platformFeeFixedCents;
  const netRevenueCents = priceCents - totalFeesCents;
  const profitCents = netRevenueCents - totalCostCents;
  return {
    ...breakdown,
    totalCostCents,
    priceCents,
    platformFeePercentCents,
    platformFeeFixedCents,
    totalFeesCents,
    netRevenueCents,
    profitCents,
  };
}

export type SafetyLevel = 'LOSS' | 'LOW_MARGIN' | 'OK';

export interface SafetyIndicator {
  level: SafetyLevel;
  message: string;
}

/**
 * Determine the safety indicator level.
 * @param profitCents  Profit at the sale/recommended price.
 * @param marginBps    Margin in basis points at that price.
 * @param priceCents   Sale / recommended price in cents.
 * @param breakEvenCents  Break-even price in cents.
 * @param targetMarginBps  Target margin in bps (0 = not applicable / reverse mode).
 */
export function getSafetyIndicator(
  profitCents: number,
  marginBps: number,
  priceCents: number,
  breakEvenCents: number,
  targetMarginBps: number
): SafetyIndicator {
  // 0.25% tolerance = 25 basis points — price within target ± 0.25% still counts as OK
  const MARGIN_TOLERANCE_BPS = 25;
  if (profitCents < 0 || priceCents <= breakEvenCents) {
    return { level: 'LOSS', message: 'Loss detected — You are selling below cost.' };
  }
  if (marginBps < 1000) {
    return { level: 'LOW_MARGIN', message: 'Low margin — Risk of underpricing.' };
  }
  if (targetMarginBps > 0 && marginBps < targetMarginBps - MARGIN_TOLERANCE_BPS) {
    return { level: 'LOW_MARGIN', message: 'Low margin — Risk of underpricing.' };
  }
  return { level: 'OK', message: 'Margin target achieved.' };
}
