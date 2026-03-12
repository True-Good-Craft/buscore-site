export type RoundingRule = 'none' | 'up_to_1_00' | 'up_to_0_50' | 'psych_0_99' | 'psych_0_95' | 'ceil_dollar' | 'floor_dollar';
export type OverheadMode = 'percent' | 'fixed';
export type GoalMode = 'margin' | 'profit';

export interface RawInputs {
  productName: string;
  currencySymbol: string;
  materials: string;
  packaging: string;
  laborMinutes: string;
  laborRate: string;
  overheadMode: OverheadMode;
  overheadPercent: string;
  overheadFixed: string;
  feePct: string;
  feeFixed: string;
  shippingIncluded: boolean;
  shippingCost: string;
  goalMode: GoalMode;
  targetMargin: string;
  targetProfit: string;
  roundingRule: RoundingRule;
  taxEnabled: boolean;
  taxRate: string;
}

export interface ParsedInputs {
  currencySymbol: string;
  materialsCents: number;
  packagingCents: number;
  laborMinutes: number;
  laborRateCents: number;  // cents per hour
  overheadMode: OverheadMode;
  overheadBps: number;     // used when mode=percent
  overheadFixedCents: number; // used when mode=fixed
  feePctBps: number;
  feeFixedCents: number;
  shippingIncluded: boolean;
  shippingCents: number;
  goalMode: GoalMode;
  targetMarginBps: number;
  targetProfitCents: number;
  roundingRule: RoundingRule;
  taxEnabled: boolean;
  taxBps: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface Outputs {
  currencySymbol: string;
  totalCostCents: number;
  breakEvenPriceCents: number;
  recommendedPriceCents: number;
  profitCents: number;
  marginBps: number;   // profit/price * 10000 (integer)
  totalFeesCents: number;
  feePctAmountCents: number;
  feeFixedCents: number;
  // breakdown
  materialsCents: number;
  packagingCents: number;
  laborCostCents: number;
  overheadCostCents: number;
  shippingCostCents: number;
  // tax display (if enabled)
  taxEnabled: boolean;
  taxAmountCents: number;
  displayPriceWithTaxCents: number;
  warnings: string[];
}
