# Price Guard — Source of Truth (SoT)

> **This document is the single source of truth for all product decisions.**
> No feature, formula, or UX change may be implemented without first updating this file.
> See [Change Process](#change-process) at the bottom.

---

## Product Objectives

Success means:
1. A maker can open the page, enter their real costs in under 2 minutes, and see a defensible selling price.
2. The math is transparent — formulas are shown alongside results.
3. The tool runs entirely in the browser; no data leaves the device by default.
4. The page loads and is usable on mobile without a native app.

---

## SoT Delta — 2026-03-02 (v1.0.2)

- **Scope:** Telemetry trigger hardening only.
- **Change:** Ensure Lighthouse ping executes exactly once per explicit Calculate click by using an explicit Calculate button trigger (`type="button"`) and a local in-flight guard in `App.tsx`.
- **Non-change:** No pricing formulas, rounding behavior, solver logic, or Lighthouse service behavior changed.

---

## Non-Goals (explicitly out of scope for MVP)

- No user accounts or authentication.
- No server-side logic or database.
- No currency conversion.
- No multi-product batch calculation.
- No inventory tracking.
- No analytics/tracking beyond what Cloudflare Pages provides by default.
- No native mobile app.
- No integrations (Etsy, Shopify, etc.) in MVP.

---

## MVP Feature List

### Free tier (no unlock required)
- Enter all input fields and see break-even price.
- See target profit price and target margin price.
- Choose rounding rule.
- Results update live as inputs change.

### Paid / unlock tier (post-MVP, details TBD)
- Save/load multiple product presets (localStorage).
- Export results as CSV or PDF.
- Batch calculation across multiple products.

---

## Inputs

| Field | Type | Default | Notes |
|---|---|---|---|
| Product name | text | "" | Optional display label |
| Currency symbol | text (≤3 chars) | "$" | Displayed in outputs |
| Materials | currency (≥ 0) | 0.00 | Raw material cost |
| Packaging | currency (≥ 0) | 0.00 | Packaging cost |
| Labor minutes | integer (≥ 0) | 0 | Time spent on product |
| Labor rate | currency (≥ 0) | 0.00 | Hourly rate in $/hr |
| Overhead mode | enum | fixed | `percent` or `fixed` |
| Overhead % | percentage (0–99) | 0 | Applies to (materials + packaging + labor) when mode=percent |
| Overhead $ | currency (≥ 0) | 0.00 | Fixed overhead amount when mode=fixed |
| Platform fee % | percentage (0–99) | 0 | e.g. Etsy/Shopify transaction % |
| Platform fee fixed $ | currency (≥ 0) | 0.00 | e.g. per-transaction flat fee |
| Include shipping | boolean | false | Toggle to add shipping as a cost |
| Shipping cost $ | currency (≥ 0) | 0.00 | Shown only when shipping is enabled |
| Goal mode | enum | margin | `margin` or `profit` |
| Target margin % | percentage (0–99) | 30 | Used when goal mode = margin |
| Target profit $ | currency (≥ 0) | 0.00 | Used when goal mode = profit |
| Rounding rule | enum | none | `none`, `up_to_1_00`, `up_to_0_50`, `psych_0_99` |
| Tax enabled | boolean | false | Toggle to show tax-inclusive display price |
| Tax rate % | percentage (0–99) | 0 | Used only for display; not included in break-even or recommended price |

---

## Outputs

| Field | Description |
|---|---|
| Break-even floor price | Minimum price that covers all costs + fees (profit ≥ 0) |
| Recommended price | Price that meets the chosen goal (target margin % or target profit $) |
| Profit ($) | `recommended_price - total_cost - total_fees` |
| Margin (%) | `profit / recommended_price × 100` |
| Total fees | `fee_pct_amount + fee_fixed` |
| Display price with tax | `recommended_price + tax_amount` (shown only if tax enabled) |
| Tax amount | `recommended_price × tax_rate` (shown only if tax enabled) |
| Cost breakdown table | Itemised: materials, packaging, labor, overhead, shipping, fees, profit |

---

## Pricing Math

All monetary values are stored and computed as **integer cents** (e.g., $12.50 = 1250).
All percentages are stored as **integer basis points** (bps): 1% = 100 bps, 6.5% = 650 bps.

### Labor cost

```
labor_cost_cents = round_half_up((labor_minutes × labor_rate_cents_per_hour) / 60)
```

### Overhead cost

When mode = `percent`:
```
overhead_cost_cents = round_half_up((overhead_bps × (materials_cents + packaging_cents + labor_cost_cents)) / 10000)
```

When mode = `fixed`:
```
overhead_cost_cents = overhead_fixed_cents
```

### Total cost

```
total_cost_cents = materials_cents + packaging_cents + labor_cost_cents + overhead_cost_cents + shipping_cost_cents
```

### Fee calculation (applied to a given price)

```
fee_pct_amount_cents = round_half_up((price_cents × fee_pct_bps) / 10000)
total_fees_cents     = fee_pct_amount_cents + fee_fixed_cents
```

### Profit (at a given price)

```
profit_cents = price_cents - total_cost_cents - total_fees_cents
```

### Margin check

A price satisfies `target_margin_bps` if:
```
profit_cents × 10000 >= target_margin_bps × price_cents
```

### Break-even price solver

Algebraic approximation (denominator = `10000 - fee_pct_bps`):
```
approx_price = ceil((total_cost_cents + fee_fixed_cents) × 10000 / denom_bps)
```
Apply rounding rule, then verify and increment if the break-even condition is not met.

### Target price solver (margin mode)

Denominator = `10000 - fee_pct_bps - target_margin_bps`. If ≤ 0, margin is **impossible**.

```
approx_price = ceil((total_cost_cents + fee_fixed_cents) × 10000 / denom_bps)
```
Apply rounding rule, verify, increment if needed.

### Target price solver (profit mode)

Denominator = `10000 - fee_pct_bps`.

```
approx_price = ceil((total_cost_cents + fee_fixed_cents + target_profit_cents) × 10000 / denom_bps)
```
Apply rounding rule, verify, increment if needed.

### Tax display (output only)

```
tax_amount_cents          = round_half_up((recommended_price_cents × tax_bps) / 10000)
display_price_with_tax    = recommended_price_cents + tax_amount_cents
```

Tax is **never** included in the break-even or recommended price calculation.

### Rounding rules

| Rule | Behaviour (on price in cents) |
|---|---|
| `none` | No rounding; price unchanged |
| `up_to_1_00` | `ceil(price / 100) × 100` |
| `up_to_0_50` | `ceil(price / 50) × 50` |
| `psych_0_99` | If `price % 100 == 99`, unchanged; otherwise `ceil(price / 100) × 100 - 1` |

Next-step increment per rule (used during verify loop):

| Rule | Increment |
|---|---|
| `none` | +1 cent |
| `up_to_1_00` | +100 cents ($1.00) |
| `up_to_0_50` | +50 cents ($0.50) |
| `psych_0_99` | +100 cents ($1.00) |

---

## Guardrails

| Condition | Behaviour |
|---|---|
| `fee_pct_bps >= 10000` (≥ 100%) | Hard error: "Fee percentage cannot be 100% or more." |
| `fee_pct_bps + target_margin_bps >= 10000` | Warning: impossible margin; fall back to break-even price |
| `target_margin_bps >= 10000` (≥ 100%) | Validation error on target margin field |
| Any required field is non-numeric or negative | Per-field validation error; results panel shows "Fix the errors" hint |
| Division by zero (denom_bps ≤ 0) | Returns `Infinity`; caught and shown as a hard error |

---

## Data & Privacy Stance

- **Local-first**: all calculations happen in the browser (JavaScript).
- No input data is sent to any server.
- If localStorage is used (paid feature, post-MVP), data stays on the user's device.
- No third-party analytics scripts are bundled in the MVP build.

---

## Change Process

1. **Propose** the change by editing this file first (in a PR or commit).
2. **Record** any architectural decision in `docs/ADR/` if it affects tech stack or structure.
3. **Implement** the code change after the SoT PR is approved/merged.
4. **Update** `CHANGELOG.md` under `[Unreleased]`.
5. **Do not** implement features, formulas, or UI patterns not described here without first updating this document.

---

## Free MVP Polish

### 1. Safety Indicator Banner (UI-only)

A coloured banner is shown above the Results card based on the computed profit and margin:

| Level | Condition | Colour | Message |
|---|---|---|---|
| `LOSS` | `recommended_price <= break_even` OR `profit < 0` | Red | "Selling at a loss." |
| `LOW_MARGIN` | `margin < 10%` (i.e. `margin_bps < 1000`) | Amber | "Low margin." |
| `OK` | `margin >= target_margin - 0.25%` (i.e. `margin_bps >= target_margin_bps - 25`) | Green | "Margin target achieved." |

In **Reverse mode** there is no target margin; the `OK` condition simplifies to `margin >= 10%`.

### 2. Platform Takes Line in Breakdown

Below **Net Revenue** in the cost breakdown, add:

```
Platform keeps: $X (Y%)
```

Where:
- `X` = `total_fees_cents / 100` (formatted to 2 dp)
- `Y%` = `total_fees_cents / price_cents × 100` (formatted to 2 dp)

### 3. Reverse Mode (Profit From Sale Price)

A **Mode** toggle at the top of the inputs panel switches between:
- **Required Price** (default): existing solver behaviour
- **Profit From Sale Price**: user enters a known marketplace sale price and sees the resulting breakdown

When **Profit From Sale Price** is active:
- Hide Goal mode, Target margin, and Target profit inputs.
- Show a single input: **Marketplace Sale Price ($)**.
- Compute breakdown, net revenue, profit, margin, and safety indicator at that price using the same fee/cost model.
- Break-even is still computed and shown for reference.

Formula for reverse mode breakdown at an arbitrary `sale_price_cents`:

```
fee_pct_amount_cents = round_half_up((sale_price_cents × fee_pct_bps) / 10000)
total_fees_cents     = fee_pct_amount_cents + fee_fixed_cents
net_revenue_cents    = sale_price_cents - total_fees_cents
profit_cents         = net_revenue_cents - total_cost_cents
margin_bps           = round_half_up((profit_cents × 10000) / sale_price_cents)
```

### 4. Rounding Rules Expansion

The following rounding rules are added to the existing set:

| Rule | Behaviour (on price in cents) |
|---|---|
| `psych_0_99` | (existing) `ceil(price / 100) × 100 - 1`; if `price % 100 == 99`, unchanged |
| `psych_0_95` | Same pattern ending in .95: if `price % 100 == 95`, unchanged; if `price % 100 < 95`, `floor(price / 100) × 100 + 95`; otherwise `(floor(price / 100) + 1) × 100 + 95` |
| `ceil_dollar` | Same as existing `up_to_1_00`: `ceil(price / 100) × 100` |
| `floor_dollar` | `floor(price / 100) × 100` |

Next-step increment per rule (used during verify loop):

| Rule | Increment |
|---|---|
| `psych_0_95` | +100 cents ($1.00) |
| `ceil_dollar` | +100 cents ($1.00) |
| `floor_dollar` | +100 cents ($1.00) |

The verify loop guarantees goal satisfaction for all rules.

### 5. PWA Support

- `public/manifest.json` — app name, theme colour, display=standalone, 192 and 512 icons
- `public/sw.js` — service worker with basic offline cache strategy
- `public/icons/icon-192.png` and `public/icons/icon-512.png` — placeholder icons
- `index.html` — `<link rel="manifest">` and `<meta name="theme-color">` added

## MVP Feature List

### Free tier (no unlock required)
- Enter all input fields and see break-even price.
- See target profit price and target margin price.
- Choose rounding rule.
- Results update live as inputs change.

### Paid / unlock tier (post-MVP, details TBD)
- Save/load multiple product presets (localStorage).
- Export results as CSV or PDF.
- Batch calculation across multiple products.

---

## Inputs

| Field | Type | Default | Notes |
|---|---|---|---|
| Material cost | currency (≥ 0) | 0.00 | Raw materials + packaging |
| Labour cost | currency (≥ 0) | 0.00 | Time × hourly rate |
| Platform fee | percentage (0–99) | 0 | e.g. Etsy listing/transaction % |
| Payment processing fee | percentage (0–99) | 2.9 | e.g. Stripe/PayPal rate |
| Desired profit margin | percentage (0–99) | 30 | Gross margin target |
| Tax rate | percentage (0–99) | 0 | Added on top of calculated price (optional) |
| Rounding rule | enum | None | None / Nearest $1 / Nearest $0.50 / $X.99 |

---

## Outputs

| Field | Description |
|---|---|
| Break-even price | Minimum price to cover all costs + fees |
| Target profit price | Price that yields the desired profit margin |
| Target margin price | Same as target profit price, cross-checked via margin formula |
| Applied rounding | Shows the rounding rule that was applied |

---

## Pricing Math Formulas

Let:
- `C` = total cost = material cost + labour cost
- `f_p` = platform fee rate (decimal, e.g. 0.05 for 5%)
- `f_pp` = payment processing fee rate (decimal)
- `m` = desired profit margin (decimal, e.g. 0.30 for 30%)
- `t` = tax rate (decimal)

### Break-even price

The minimum price that exactly covers costs after fees are deducted:

```
break_even = C / (1 - f_p - f_pp)
```

Then add tax:
```
break_even_with_tax = break_even * (1 + t)
```

### Target profit price (margin-based)

Using gross margin definition (`margin = (price - cost) / price`):

```
target_price = C / ((1 - f_p - f_pp) * (1 - m))
```

Then add tax:
```
target_price_with_tax = target_price * (1 + t)
```

### Rounding

Applied to the final price **after** tax:

| Rule | Behaviour |
|---|---|
| None | No rounding |
| Nearest $1 | `round(price)` |
| Nearest $0.50 | `round(price / 0.5) * 0.5` |
| $X.99 | `floor(price) + 0.99`, unless price is already < 1 |

---

## Guardrails

| Condition | Behaviour |
|---|---|
| `f_p + f_pp >= 1` | Show error: "Fees cannot equal or exceed 100%" |
| `m >= 1` | Show error: "Margin must be less than 100%" |
| `C = 0` and all fees = 0 | Show warning: "Enter at least one cost to get a meaningful result" |
| Any input is negative | Show error: "All values must be zero or positive" |
| Calculated price is `Infinity` or `NaN` | Show error: "Cannot calculate — check your inputs" |

---

## Data & Privacy Stance

- **Local-first**: all calculations happen in the browser (JavaScript).
- No input data is sent to any server.
- If localStorage is used (paid feature, post-MVP), data stays on the user's device.
- No third-party analytics scripts are bundled in the MVP build.

---

## Change Process

1. **Propose** the change by editing this file first (in a PR or commit).
2. **Record** any architectural decision in `docs/ADR/` if it affects tech stack or structure.
3. **Implement** the code change after the SoT PR is approved/merged.
4. **Update** `CHANGELOG.md` under `[Unreleased]`.
5. **Do not** implement features, formulas, or UI patterns not described here without first updating this document.
