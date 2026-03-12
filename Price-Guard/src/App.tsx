import { useState, useMemo } from 'react';
import { Calculator, Warning, ArrowCircleDown, ArrowCircleUp, CheckCircle } from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  calculatePricing,
  computeBreakdownAtPrice,
  getSafetyIndicator,
  calculateLaborCents,
  calculateOverheadCents,
  calculateTotalCostCents,
  findBreakEvenPrice,
  calculateMarginBps,
  formatCents,
  formatBps,
  parseDollars,
  parsePercent,
  type PricingInputs,
} from '@/lib/pricing';

type AppMode = 'forward' | 'reverse';

function pingLighthouse() {
  fetch('https://buscore-lighthouse.jamie-eb1.workers.dev/pg/ping', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-PG-Key': 'PG_METRIC_KEY_6f3b9c2a8d714e57b41c9023e6aa1f4d'
    },
    body: JSON.stringify({ v: '1.0.2' }),
  }).catch(() => {
    // intentionally silent
  });
}

let pingInFlight = false;

function App() {
  const [appMode, setAppMode] = useState<AppMode>('forward');
  const [salePrice, setSalePrice] = useState('15.00');

  const [materials, setMaterials] = useState('5.00');
  const [packaging, setPackaging] = useState('1.50');
  const [laborMinutes, setLaborMinutes] = useState('15');
  const [laborRate, setLaborRate] = useState('20.00');
  const [overheadMode, setOverheadMode] = useState<'percent' | 'fixed'>('percent');
  const [overheadPercent, setOverheadPercent] = useState('15');
  const [overheadFixed, setOverheadFixed] = useState('2.00');
  const [platformFeePercent, setPlatformFeePercent] = useState('10');
  const [platformFeeFixed, setPlatformFeeFixed] = useState('0.30');
  const [shippingIncluded, setShippingIncluded] = useState(false);
  const [shipping, setShipping] = useState('3.50');
  const [goalMode, setGoalMode] = useState<'margin' | 'profit'>('margin');
  const [targetMargin, setTargetMargin] = useState('30');
  const [targetProfit, setTargetProfit] = useState('10.00');
  const [roundingMode, setRoundingMode] = useState<'none' | 'dollar' | 'fifty' | 'psychological' | 'psych_0_95' | 'ceil_dollar' | 'floor_dollar'>('none');

  // Forward-mode calculations
  const computedResults = useMemo(() => {
    const inputs: PricingInputs = {
      materialsCents: parseDollars(materials),
      packagingCents: parseDollars(packaging),
      laborMinutes: parseFloat(laborMinutes) || 0,
      laborRateCentsPerHour: parseDollars(laborRate),
      overheadMode,
      overheadBps: parsePercent(overheadPercent),
      overheadCents: parseDollars(overheadFixed),
      platformFeeBps: parsePercent(platformFeePercent),
      platformFeeFixedCents: parseDollars(platformFeeFixed),
      shippingIncluded,
      shippingCents: parseDollars(shipping),
      goalMode,
      targetMarginBps: parsePercent(targetMargin),
      targetProfitCents: parseDollars(targetProfit),
      roundingMode,
    };
    return calculatePricing(inputs);
  }, [
    materials, packaging, laborMinutes, laborRate, overheadMode, overheadPercent,
    overheadFixed, platformFeePercent, platformFeeFixed, shippingIncluded, shipping,
    goalMode, targetMargin, targetProfit, roundingMode,
  ]);

  // Reverse-mode calculations
  const computedReverseResults = useMemo(() => {
    const laborCents = calculateLaborCents(parseFloat(laborMinutes) || 0, parseDollars(laborRate));
    const baseCost = parseDollars(materials) + parseDollars(packaging) + laborCents;
    const overheadCents = calculateOverheadCents(
      overheadMode,
      parsePercent(overheadPercent),
      parseDollars(overheadFixed),
      baseCost,
    );
    const shippingCents = shippingIncluded ? parseDollars(shipping) : 0;
    const totalCostCents = calculateTotalCostCents(
      parseDollars(materials),
      parseDollars(packaging),
      laborCents,
      overheadCents,
      shippingCents,
    );
    const feeBps = parsePercent(platformFeePercent);
    const feeFixed = parseDollars(platformFeeFixed);
    const priceCents = parseDollars(salePrice);
    const breakEvenCents = findBreakEvenPrice(totalCostCents, feeBps, feeFixed, 'none');
    const bd = computeBreakdownAtPrice(priceCents, totalCostCents, feeBps, feeFixed, {
      materialsCents: parseDollars(materials),
      packagingCents: parseDollars(packaging),
      laborCents,
      overheadCents,
      shippingCents,
    });
    const marginBps = calculateMarginBps(bd.profitCents, priceCents);
    return { breakdown: bd, marginBps, breakEvenCents };
  }, [materials, packaging, laborMinutes, laborRate, overheadMode, overheadPercent,
      overheadFixed, platformFeePercent, platformFeeFixed, shippingIncluded, shipping, salePrice]);

  const [results, setResults] = useState(computedResults);
  const [reverseResults, setReverseResults] = useState(computedReverseResults);

  const calculate = () => {
    if (pingInFlight) return;
    pingInFlight = true;

    setResults(computedResults);
    setReverseResults(computedReverseResults);

    const completedSuccessfully = appMode === 'reverse' || !computedResults.isImpossible;
    if (completedSuccessfully) {
      pingLighthouse();
    }

    setTimeout(() => {
      pingInFlight = false;
    }, 300);
  };

  // Safety indicator
  const safetyIndicator = useMemo(() => {
    if (appMode === 'reverse') {
      const { breakdown, marginBps, breakEvenCents } = reverseResults;
      return getSafetyIndicator(breakdown.profitCents, marginBps, breakdown.priceCents, breakEvenCents, 0);
    }
    return getSafetyIndicator(
      results.profitCents,
      results.marginBps,
      results.recommendedPriceCents,
      results.breakEvenCents,
      parsePercent(targetMargin),
    );
  }, [appMode, results, reverseResults, targetMargin]);

  const displayBreakdown = appMode === 'reverse' ? reverseResults.breakdown : results.breakdown;
  const displayProfit = appMode === 'reverse' ? reverseResults.breakdown.profitCents : results.profitCents;
  const displayMarginBps = appMode === 'reverse' ? reverseResults.marginBps : results.marginBps;
  const displayPrice = appMode === 'reverse' ? reverseResults.breakdown.priceCents : results.recommendedPriceCents;
  const displayTotalFees = displayBreakdown.totalFeesCents;
  const platformKeepsBps = displayPrice > 0
    ? Math.round((displayTotalFees * 10000) / displayPrice)
    : 0;
  const platformKeepsPct = formatBps(platformKeepsBps);

  return (
    <div className="pg-app min-h-screen bg-background p-3 md:p-8">
      <div className="mx-auto w-full max-w-[1120px]">
        <header className="mb-7 rounded-xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-sm md:p-6">
          <Button asChild variant="ghost" size="sm" className="mb-4 h-8 px-2 text-muted-foreground hover:text-foreground">
            <a href="/" aria-label="Back to BUS Core homepage">
              &larr; Back to BUS Core
            </a>
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Calculator size={40} weight="duotone" className="text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Price Guard</h1>
          </div>
          <p className="text-muted-foreground text-base md:text-lg">
            Deterministic pricing for BUS Core operators using integer-cent math.
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            All calculations use integer-cent math to prevent floating-point pricing errors.
          </p>
        </header>

        {/* Mode toggle */}
        <div className="mb-6">
          <div className="inline-flex rounded-lg border border-border/70 bg-muted/70 p-1 gap-1" role="tablist" aria-label="Calculator mode">
            <button
              role="tab"
              aria-selected={appMode === 'forward'}
              aria-controls="panel-inputs"
              onClick={() => setAppMode('forward')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${appMode === 'forward' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Required Price
            </button>
            <button
              role="tab"
              aria-selected={appMode === 'reverse'}
              aria-controls="panel-inputs"
              onClick={() => setAppMode('reverse')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${appMode === 'reverse' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Profit From Sale Price
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Cost Inputs</CardTitle>
              <CardDescription>Enter all per-unit costs and pricing parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="materials">Materials ($)</Label>
                  <Input
                    id="materials"
                    type="number"
                    step="0.01"
                    min="0"
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                    className="font-numeric"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="packaging">Packaging ($)</Label>
                  <Input
                    id="packaging"
                    type="number"
                    step="0.01"
                    min="0"
                    value={packaging}
                    onChange={(e) => setPackaging(e.target.value)}
                    className="font-numeric"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="labor-minutes">Labor (minutes)</Label>
                    <Input
                      id="labor-minutes"
                      type="number"
                      step="1"
                      min="0"
                      value={laborMinutes}
                      onChange={(e) => setLaborMinutes(e.target.value)}
                      className="font-numeric"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="labor-rate">Labor Rate ($/hr)</Label>
                    <Input
                      id="labor-rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={laborRate}
                      onChange={(e) => setLaborRate(e.target.value)}
                      className="font-numeric"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Overhead Mode</Label>
                  <Select value={overheadMode} onValueChange={(v) => setOverheadMode(v as 'percent' | 'fixed')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentage of Costs</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {overheadMode === 'percent' ? (
                  <div className="space-y-2">
                    <Label htmlFor="overhead-percent">Overhead (%)</Label>
                    <Input
                      id="overhead-percent"
                      type="number"
                      step="0.01"
                      min="0"
                      value={overheadPercent}
                      onChange={(e) => setOverheadPercent(e.target.value)}
                      className="font-numeric"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="overhead-fixed">Overhead ($)</Label>
                    <Input
                      id="overhead-fixed"
                      type="number"
                      step="0.01"
                      min="0"
                      value={overheadFixed}
                      onChange={(e) => setOverheadFixed(e.target.value)}
                      className="font-numeric"
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform-fee-percent">Platform Fee (%)</Label>
                    <Input
                      id="platform-fee-percent"
                      type="number"
                      step="0.01"
                      min="0"
                      value={platformFeePercent}
                      onChange={(e) => setPlatformFeePercent(e.target.value)}
                      className="font-numeric"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform-fee-fixed">Platform Fee ($)</Label>
                    <Input
                      id="platform-fee-fixed"
                      type="number"
                      step="0.01"
                      min="0"
                      value={platformFeeFixed}
                      onChange={(e) => setPlatformFeeFixed(e.target.value)}
                      className="font-numeric"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="shipping-included">Include Shipping in Price</Label>
                  <Switch id="shipping-included" checked={shippingIncluded} onCheckedChange={setShippingIncluded} />
                </div>

                {shippingIncluded && (
                  <div className="space-y-2">
                    <Label htmlFor="shipping">Shipping Cost ($)</Label>
                    <Input
                      id="shipping"
                      type="number"
                      step="0.01"
                      min="0"
                      value={shipping}
                      onChange={(e) => setShipping(e.target.value)}
                      className="font-numeric"
                    />
                  </div>
                )}
              </div>

              <Separator />

              {appMode === 'forward' ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Pricing Goal</Label>
                    <RadioGroup value={goalMode} onValueChange={(v) => setGoalMode(v as 'margin' | 'profit')}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="margin" id="goal-margin" />
                        <Label htmlFor="goal-margin" className="font-normal cursor-pointer">
                          Target Margin %
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="profit" id="goal-profit" />
                        <Label htmlFor="goal-profit" className="font-normal cursor-pointer">
                          Target Profit $
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {goalMode === 'margin' ? (
                    <div className="space-y-2">
                      <Label htmlFor="target-margin">Target Margin (%)</Label>
                      <Input
                        id="target-margin"
                        type="number"
                        step="0.01"
                        min="0"
                        max="99"
                        value={targetMargin}
                        onChange={(e) => setTargetMargin(e.target.value)}
                        className="font-numeric"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="target-profit">Target Profit ($)</Label>
                      <Input
                        id="target-profit"
                        type="number"
                        step="0.01"
                        min="0"
                        value={targetProfit}
                        onChange={(e) => setTargetProfit(e.target.value)}
                        className="font-numeric"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="sale-price">Marketplace Sale Price ($)</Label>
                  <Input
                    id="sale-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="font-numeric"
                  />
                </div>
              )}

              {appMode === 'forward' && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Price Rounding</Label>
                    <Select value={roundingMode} onValueChange={(v) => setRoundingMode(v as typeof roundingMode)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (exact)</SelectItem>
                        <SelectItem value="dollar">Up to nearest $1.00</SelectItem>
                        <SelectItem value="fifty">Up to nearest $0.50</SelectItem>
                        <SelectItem value="psychological">Psychological ($X.99)</SelectItem>
                        <SelectItem value="psych_0_95">Psychological ($X.95)</SelectItem>
                        <SelectItem value="ceil_dollar">Ceiling to next dollar</SelectItem>
                        <SelectItem value="floor_dollar">Floor to previous dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Separator />

              <Button type="button" onClick={calculate} className="w-full">
                Calculate
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Safety Indicator */}
            {safetyIndicator.level === 'LOSS' && (
              <Alert className="bg-destructive/10 border-destructive" role="alert" aria-label="Error: Selling at a loss">
                <Warning size={20} weight="fill" className="text-destructive" />
                <AlertDescription className="ml-2 text-destructive font-medium">{safetyIndicator.message}</AlertDescription>
              </Alert>
            )}
            {safetyIndicator.level === 'LOW_MARGIN' && (
              <Alert className="bg-warning/10 border-warning" role="alert" aria-label="Warning: Low margin">
                <ArrowCircleDown size={20} weight="fill" className="text-warning" />
                <AlertDescription className="ml-2 text-warning-foreground font-medium">{safetyIndicator.message}</AlertDescription>
              </Alert>
            )}
            {safetyIndicator.level === 'OK' && (
              <Alert className="bg-green-500/10 border-green-500" role="status" aria-label="Success: Margin target achieved">
                <CheckCircle size={20} weight="fill" className="text-green-600" />
                <AlertDescription className="ml-2 text-green-700 font-medium">{safetyIndicator.message}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  {appMode === 'reverse' ? 'Breakdown at entered sale price' : 'Calculated pricing recommendations'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {appMode === 'forward' && results.isImpossible && (
                  <Alert variant="destructive" className="bg-warning/10 border-warning text-warning-foreground">
                    <Warning size={20} weight="fill" className="text-warning" />
                    <AlertDescription className="ml-2">{results.impossibleReason}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  {appMode === 'forward' && (
                    <>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Break-Even Floor Price</div>
                        <div className="text-3xl font-bold font-numeric text-primary">
                          ${formatCents(results.breakEvenCents)}
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Recommended Price</div>
                        <div className="text-4xl font-bold font-numeric">${formatCents(results.recommendedPriceCents)}</div>
                      </div>
                    </>
                  )}

                  {appMode === 'reverse' && (
                    <>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Break-Even Floor Price</div>
                        <div className="text-3xl font-bold font-numeric text-primary">
                          ${formatCents(reverseResults.breakEvenCents)}
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Sale Price (entered)</div>
                        <div className="text-4xl font-bold font-numeric">${formatCents(displayPrice)}</div>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Profit</div>
                      <div className="text-2xl font-bold font-numeric text-accent">
                        ${formatCents(displayProfit)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Margin</div>
                      <div className="text-2xl font-bold font-numeric text-accent">
                        {formatBps(displayMarginBps)}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>
                  {appMode === 'reverse' ? 'Detailed breakdown at sale price' : 'Detailed breakdown at recommended price'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Materials</span>
                    <span className="font-numeric font-medium">${formatCents(displayBreakdown.materialsCents)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Packaging</span>
                    <span className="font-numeric font-medium">${formatCents(displayBreakdown.packagingCents)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Labor</span>
                    <span className="font-numeric font-medium">${formatCents(displayBreakdown.laborCents)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Overhead</span>
                    <span className="font-numeric font-medium">${formatCents(displayBreakdown.overheadCents)}</span>
                  </div>
                  {shippingIncluded && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-numeric font-medium">${formatCents(displayBreakdown.shippingCents)}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between py-2 font-semibold">
                    <span>Total Cost</span>
                    <span className="font-numeric">${formatCents(displayBreakdown.totalCostCents)}</span>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex justify-between py-2 text-base font-semibold">
                    <span>Price</span>
                    <span className="font-numeric">${formatCents(displayBreakdown.priceCents)}</span>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Platform Fee (%)</span>
                    <span className="font-numeric font-medium text-destructive">
                      -${formatCents(displayBreakdown.platformFeePercentCents)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Platform Fee (fixed)</span>
                    <span className="font-numeric font-medium text-destructive">
                      -${formatCents(displayBreakdown.platformFeeFixedCents)}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between py-2 font-semibold">
                    <span>Net Revenue</span>
                    <span className="font-numeric">${formatCents(displayBreakdown.netRevenueCents)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-xs font-semibold">
                    <span>Platform keeps</span>
                    <span className="font-numeric text-destructive">
                      ${formatCents(displayTotalFees)} ({platformKeepsPct}%)
                    </span>
                  </div>

                  <Separator className="my-3 bg-primary/20" />

                  <div className="flex justify-between py-2 text-lg font-bold">
                    <span>Profit</span>
                    <span className="font-numeric text-accent">${formatCents(displayBreakdown.profitCents)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <footer className="mt-10 py-4 text-center text-xs text-muted-foreground border-t border-border/70">
        Price Guard — A{' '}
        <a
          href="https://truegoodcraft.ca"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          True Good Craft
        </a>{' '}
        Tool
      </footer>
    </div>
  );
}

export default App;

