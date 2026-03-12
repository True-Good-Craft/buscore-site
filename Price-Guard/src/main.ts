import './style.css';
import type { RawInputs } from './lib/types.js';
import { parseInputs } from './lib/parser.js';
import { computeOutputs } from './lib/pricing.js';
import { formatCents } from './lib/money.js';

const DEFAULT_INPUTS: RawInputs = {
  productName: '',
  currencySymbol: '$',
  materials: '0',
  packaging: '0',
  laborMinutes: '0',
  laborRate: '0',
  overheadMode: 'fixed',
  overheadPercent: '0',
  overheadFixed: '0',
  feePct: '0',
  feeFixed: '0',
  shippingIncluded: false,
  shippingCost: '0',
  goalMode: 'margin',
  targetMargin: '30',
  targetProfit: '0',
  roundingRule: 'none',
  taxEnabled: false,
  taxRate: '0',
};

let state: RawInputs = { ...DEFAULT_INPUTS };

function getInputPanel(): HTMLElement {
  return document.querySelector('.panel-inputs')!;
}

function getResultsPanel(): HTMLElement {
  return document.querySelector('.panel-results')!;
}

function setVal(id: string, val: string | boolean): void {
  const el = document.getElementById(id);
  if (!el) return;
  if (el instanceof HTMLInputElement) {
    if (el.type === 'checkbox') el.checked = val as boolean;
    else el.value = val as string;
  } else if (el instanceof HTMLSelectElement) {
    el.value = val as string;
  }
}

function buildForm(): void {
  const panel = getInputPanel();
  panel.innerHTML = `
    <h2>Inputs</h2>
    
    <div class="form-section">
      <h3>Product</h3>
      <div class="field-row">
        <label for="productName">Product name (optional)</label>
        <input type="text" id="productName" placeholder="e.g., Handmade candle">
      </div>
      <div class="field-row">
        <label for="currencySymbol">Currency symbol</label>
        <input type="text" id="currencySymbol" maxlength="3" placeholder="$">
      </div>
    </div>

    <div class="form-section">
      <h3>Costs</h3>
      <div class="field-row">
        <label for="materials">Materials ($)</label>
        <input type="text" id="materials" inputmode="decimal" placeholder="0.00">
        <span class="field-error" id="materials-err"></span>
      </div>
      <div class="field-row">
        <label for="packaging">Packaging ($)</label>
        <input type="text" id="packaging" inputmode="decimal" placeholder="0.00">
        <span class="field-error" id="packaging-err"></span>
      </div>
      <div class="field-row">
        <label for="laborMinutes">Labor (minutes)</label>
        <input type="text" id="laborMinutes" inputmode="numeric" placeholder="0">
        <span class="field-error" id="laborMinutes-err"></span>
      </div>
      <div class="field-row">
        <label for="laborRate">Labor rate ($/hr)</label>
        <input type="text" id="laborRate" inputmode="decimal" placeholder="0.00">
        <span class="field-error" id="laborRate-err"></span>
      </div>
    </div>

    <div class="form-section">
      <h3>Overhead</h3>
      <div class="field-row radio-row">
        <label><input type="radio" name="overheadMode" value="percent" id="overheadModePercent"> Percentage of costs</label>
        <label><input type="radio" name="overheadMode" value="fixed" id="overheadModeFixed"> Fixed amount</label>
      </div>
      <div class="field-row" id="overheadPercentRow">
        <label for="overheadPercent">Overhead (%)</label>
        <input type="text" id="overheadPercent" inputmode="decimal" placeholder="0">
        <span class="field-error" id="overheadPercent-err"></span>
      </div>
      <div class="field-row" id="overheadFixedRow">
        <label for="overheadFixed">Overhead ($)</label>
        <input type="text" id="overheadFixed" inputmode="decimal" placeholder="0.00">
        <span class="field-error" id="overheadFixed-err"></span>
      </div>
    </div>

    <div class="form-section">
      <h3>Platform Fees</h3>
      <div class="field-row">
        <label for="feePct">Fee (%)</label>
        <input type="text" id="feePct" inputmode="decimal" placeholder="0">
        <span class="field-error" id="feePct-err"></span>
      </div>
      <div class="field-row">
        <label for="feeFixed">Fee fixed ($)</label>
        <input type="text" id="feeFixed" inputmode="decimal" placeholder="0.00">
        <span class="field-error" id="feeFixed-err"></span>
      </div>
    </div>

    <div class="form-section">
      <h3>Shipping</h3>
      <div class="field-row checkbox-row">
        <label><input type="checkbox" id="shippingIncluded"> Include shipping cost in price</label>
      </div>
      <div class="field-row" id="shippingCostRow" style="display:none">
        <label for="shippingCost">Shipping ($)</label>
        <input type="text" id="shippingCost" inputmode="decimal" placeholder="0.00">
        <span class="field-error" id="shippingCost-err"></span>
      </div>
    </div>

    <div class="form-section">
      <h3>Goal</h3>
      <div class="field-row radio-row">
        <label><input type="radio" name="goalMode" value="margin" id="goalModeMargin"> Target margin (%)</label>
        <label><input type="radio" name="goalMode" value="profit" id="goalModeProfit"> Target profit ($)</label>
      </div>
      <div class="field-row" id="targetMarginRow">
        <label for="targetMargin">Target margin (%)</label>
        <input type="text" id="targetMargin" inputmode="decimal" placeholder="30">
        <span class="field-error" id="targetMargin-err"></span>
      </div>
      <div class="field-row" id="targetProfitRow" style="display:none">
        <label for="targetProfit">Target profit ($)</label>
        <input type="text" id="targetProfit" inputmode="decimal" placeholder="0.00">
        <span class="field-error" id="targetProfit-err"></span>
      </div>
    </div>

    <div class="form-section">
      <h3>Rounding</h3>
      <div class="field-row">
        <label for="roundingRule">Rounding rule</label>
        <select id="roundingRule">
          <option value="none">No rounding</option>
          <option value="up_to_1_00">Round up to nearest $1.00</option>
          <option value="up_to_0_50">Round up to nearest $0.50</option>
          <option value="psych_0_99">Psychological .99</option>
        </select>
      </div>
    </div>

    <div class="form-section">
      <h3>Tax (display only)</h3>
      <div class="field-row checkbox-row">
        <label><input type="checkbox" id="taxEnabled"> Show tax-inclusive price</label>
      </div>
      <div class="field-row" id="taxRateRow" style="display:none">
        <label for="taxRate">Tax rate (%)</label>
        <input type="text" id="taxRate" inputmode="decimal" placeholder="0">
        <span class="field-error" id="taxRate-err"></span>
      </div>
    </div>
  `;

  // Set initial values
  setVal('productName', state.productName);
  setVal('currencySymbol', state.currencySymbol);
  setVal('materials', state.materials);
  setVal('packaging', state.packaging);
  setVal('laborMinutes', state.laborMinutes);
  setVal('laborRate', state.laborRate);
  setVal('overheadPercent', state.overheadPercent);
  setVal('overheadFixed', state.overheadFixed);
  setVal('feePct', state.feePct);
  setVal('feeFixed', state.feeFixed);
  setVal('shippingIncluded', state.shippingIncluded);
  setVal('shippingCost', state.shippingCost);
  setVal('targetMargin', state.targetMargin);
  setVal('targetProfit', state.targetProfit);
  setVal('roundingRule', state.roundingRule);
  setVal('taxEnabled', state.taxEnabled);
  setVal('taxRate', state.taxRate);

  // Set radio buttons
  const overheadRadio = document.querySelector(`input[name="overheadMode"][value="${state.overheadMode}"]`) as HTMLInputElement | null;
  if (overheadRadio) overheadRadio.checked = true;
  const goalRadio = document.querySelector(`input[name="goalMode"][value="${state.goalMode}"]`) as HTMLInputElement | null;
  if (goalRadio) goalRadio.checked = true;

  updateOverheadVisibility();
  updateGoalVisibility();
  updateShippingVisibility();
  updateTaxVisibility();

  // Event listeners
  panel.addEventListener('input', onInputChange);
  panel.addEventListener('change', onInputChange);
}

function updateOverheadVisibility(): void {
  const pctRow = document.getElementById('overheadPercentRow');
  const fixRow = document.getElementById('overheadFixedRow');
  if (pctRow) pctRow.style.display = state.overheadMode === 'percent' ? '' : 'none';
  if (fixRow) fixRow.style.display = state.overheadMode === 'fixed' ? '' : 'none';
}

function updateGoalVisibility(): void {
  const marginRow = document.getElementById('targetMarginRow');
  const profitRow = document.getElementById('targetProfitRow');
  if (marginRow) marginRow.style.display = state.goalMode === 'margin' ? '' : 'none';
  if (profitRow) profitRow.style.display = state.goalMode === 'profit' ? '' : 'none';
}

function updateShippingVisibility(): void {
  const row = document.getElementById('shippingCostRow');
  if (row) row.style.display = state.shippingIncluded ? '' : 'none';
}

function updateTaxVisibility(): void {
  const row = document.getElementById('taxRateRow');
  if (row) row.style.display = state.taxEnabled ? '' : 'none';
}

function onInputChange(e: Event): void {
  const target = e.target as HTMLInputElement | HTMLSelectElement;
  const id = target.id;
  const name = (target as HTMLInputElement).name;

  if (id === 'productName') state.productName = (target as HTMLInputElement).value;
  else if (id === 'currencySymbol') state.currencySymbol = (target as HTMLInputElement).value || '$';
  else if (id === 'materials') state.materials = (target as HTMLInputElement).value;
  else if (id === 'packaging') state.packaging = (target as HTMLInputElement).value;
  else if (id === 'laborMinutes') state.laborMinutes = (target as HTMLInputElement).value;
  else if (id === 'laborRate') state.laborRate = (target as HTMLInputElement).value;
  else if (name === 'overheadMode') {
    state.overheadMode = (target as HTMLInputElement).value as 'percent' | 'fixed';
    updateOverheadVisibility();
  }
  else if (id === 'overheadPercent') state.overheadPercent = (target as HTMLInputElement).value;
  else if (id === 'overheadFixed') state.overheadFixed = (target as HTMLInputElement).value;
  else if (id === 'feePct') state.feePct = (target as HTMLInputElement).value;
  else if (id === 'feeFixed') state.feeFixed = (target as HTMLInputElement).value;
  else if (id === 'shippingIncluded') {
    state.shippingIncluded = (target as HTMLInputElement).checked;
    updateShippingVisibility();
  }
  else if (id === 'shippingCost') state.shippingCost = (target as HTMLInputElement).value;
  else if (name === 'goalMode') {
    state.goalMode = (target as HTMLInputElement).value as 'margin' | 'profit';
    updateGoalVisibility();
  }
  else if (id === 'targetMargin') state.targetMargin = (target as HTMLInputElement).value;
  else if (id === 'targetProfit') state.targetProfit = (target as HTMLInputElement).value;
  else if (id === 'roundingRule') state.roundingRule = (target as HTMLSelectElement).value as RawInputs['roundingRule'];
  else if (id === 'taxEnabled') {
    state.taxEnabled = (target as HTMLInputElement).checked;
    updateTaxVisibility();
  }
  else if (id === 'taxRate') state.taxRate = (target as HTMLInputElement).value;

  recalculate();
}

function showFieldErrors(errors: Array<{ field: string; message: string }>): void {
  // Clear all errors first
  for (const el of document.querySelectorAll('.field-error')) {
    el.textContent = '';
  }
  // Show per-field errors
  for (const err of errors) {
    const errEl = document.getElementById(`${err.field}-err`);
    if (errEl) errEl.textContent = err.message;
  }
}

function renderResults(html: string): void {
  const panel = getResultsPanel();
  panel.innerHTML = `<h2>Results</h2>${html}`;
}

function recalculate(): void {
  const { parsed, errors } = parseInputs(state);
  showFieldErrors(errors);

  if (errors.length > 0) {
    renderResults('<p class="results-hint">Fix the errors on the left to see results.</p>');
    return;
  }

  const result = computeOutputs(parsed);

  if ('error' in result) {
    renderResults(`<div class="global-error">${result.error}</div>`);
    return;
  }

  const sym = result.currencySymbol;
  const fmt = (c: number) => formatCents(c, sym);

  const breakEvenStr = fmt(result.breakEvenPriceCents);
  const recStr = fmt(result.recommendedPriceCents);
  const profitStr = fmt(result.profitCents);
  const marginPct = (result.marginBps / 100).toFixed(2);
  const totalFeesStr = fmt(result.totalFeesCents);
  const totalCostStr = fmt(result.totalCostCents);

  const productTitle = state.productName ? `<p class="product-title">${state.productName}</p>` : '';

  const warningsHtml = result.warnings.length > 0
    ? `<div class="warnings">${result.warnings.map(w => `<p class="warning">⚠️ ${w}</p>`).join('')}</div>`
    : '';

  const taxHtml = result.taxEnabled
    ? `<div class="result-item">
        <span class="result-label">Display price (with tax)</span>
        <span class="result-value">${fmt(result.displayPriceWithTaxCents)}</span>
       </div>
       <div class="result-item">
        <span class="result-label">Tax amount</span>
        <span class="result-value">${fmt(result.taxAmountCents)}</span>
       </div>`
    : '';

  const html = `
    ${productTitle}
    ${warningsHtml}
    <div class="result-summary">
      <div class="result-item result-hero">
        <span class="result-label">Recommended price</span>
        <span class="result-value result-price">${recStr}</span>
      </div>
      <div class="result-item">
        <span class="result-label">Break-even floor</span>
        <span class="result-value">${breakEvenStr}</span>
      </div>
      <div class="result-item">
        <span class="result-label">Profit</span>
        <span class="result-value${result.profitCents < 0 ? ' loss' : ''}">${profitStr} (${marginPct}%)</span>
      </div>
      <div class="result-item">
        <span class="result-label">Total fees</span>
        <span class="result-value">${totalFeesStr}</span>
      </div>
      ${taxHtml}
    </div>

    <details class="breakdown" open>
      <summary>Cost breakdown</summary>
      <table class="breakdown-table">
        <tbody>
          <tr><td>Materials</td><td>${fmt(result.materialsCents)}</td></tr>
          <tr><td>Packaging</td><td>${fmt(result.packagingCents)}</td></tr>
          <tr><td>Labor</td><td>${fmt(result.laborCostCents)}</td></tr>
          <tr><td>Overhead</td><td>${fmt(result.overheadCostCents)}</td></tr>
          ${result.shippingCostCents > 0 ? `<tr><td>Shipping</td><td>${fmt(result.shippingCostCents)}</td></tr>` : ''}
          <tr class="subtotal"><td>Total cost</td><td>${totalCostStr}</td></tr>
          <tr><td>Fee (% of price)</td><td>${fmt(result.feePctAmountCents)}</td></tr>
          <tr><td>Fee (fixed)</td><td>${fmt(result.feeFixedCents)}</td></tr>
          <tr class="subtotal"><td>Total fees</td><td>${totalFeesStr}</td></tr>
          <tr><td>Net revenue</td><td>${fmt(result.recommendedPriceCents - result.totalFeesCents)}</td></tr>
          <tr class="profit-row${result.profitCents < 0 ? ' loss-row' : ''}"><td>Profit</td><td>${profitStr}</td></tr>
        </tbody>
      </table>
    </details>
  `;

  renderResults(html);
}

// Initialize
buildForm();
recalculate();
