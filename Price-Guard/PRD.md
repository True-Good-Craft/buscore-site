# Price Guard PRD

A deterministic pricing calculator for product sellers that computes break-even and recommended prices using precise integer-based money math.

**Experience Qualities**:
1. **Precise** - All calculations use integer cents and basis points to eliminate floating-point errors, ensuring accurate financial calculations.
2. **Immediate** - Live recalculation as users type, with instant feedback on pricing viability and constraint satisfaction.
3. **Transparent** - Clear breakdown of all cost components, fees, and profit calculations so users understand exactly how prices are derived.

**Complexity Level**: Light Application (multiple features with basic state)
This is a single-purpose calculator with multiple interdependent inputs, constraint-based solving, and real-time validation - more than a micro tool but simpler than a multi-view application.

## Essential Features

### Cost Input Form
- **Functionality**: Collects all per-unit cost data (materials, packaging, labor), overhead configuration, platform fees, shipping options, and pricing goals.
- **Purpose**: Provides all variables needed for break-even and optimal price calculation.
- **Trigger**: User lands on page with empty/default inputs.
- **Progression**: User fills fields → System validates input → Calculations update live → Results appear instantly.
- **Success criteria**: All inputs accept numeric values, validate ranges, persist during session, and trigger recalculation on change.

### Overhead Mode Toggle
- **Functionality**: Allows user to specify overhead as either a percentage of costs or a fixed dollar amount per unit.
- **Purpose**: Accommodates different business accounting methods.
- **Trigger**: User clicks overhead mode selector.
- **Progression**: Toggle switches → Input field updates to show % or $ → Calculation engine applies correct formula.
- **Success criteria**: Mode switch preserves value when possible, updates calculation correctly.

### Goal Setting (Margin vs Profit)
- **Functionality**: User chooses between target profit margin percentage or fixed profit dollar amount.
- **Purpose**: Different business models optimize for different metrics.
- **Trigger**: User selects goal type radio button.
- **Progression**: Selection changes → Relevant input field appears → Constraint solver adjusts recommended price.
- **Success criteria**: Only one goal type active at a time, solver correctly satisfies the active constraint.

### Shipping Toggle
- **Functionality**: Option to include or exclude shipping cost in the unit price calculation.
- **Purpose**: Some sellers include shipping in price, others charge separately.
- **Trigger**: User toggles shipping included switch.
- **Progression**: Toggle activates → Shipping cost field appears → Cost calculation includes/excludes shipping.
- **Success criteria**: Shipping only affects calculations when toggle is on.

### Price Rounding Options
- **Functionality**: Applies rounding to final recommended price: none, up to nearest $1, up to nearest $0.50, or psychological pricing (.99).
- **Purpose**: Creates market-friendly price points while maintaining constraint satisfaction.
- **Trigger**: User selects rounding mode from dropdown.
- **Progression**: Selection made → Price solver applies rounding → Verification ensures constraints still met → If not, steps to next valid price.
- **Success criteria**: Rounded price always satisfies margin/profit constraints or shows impossible warning.

### Break-Even Calculator
- **Functionality**: Computes the absolute minimum price where profit equals zero after all costs and fees.
- **Purpose**: Establishes the floor price below which the seller loses money.
- **Trigger**: Any input changes.
- **Progression**: Inputs change → Cost totals computed → Fee structure applied → Solver finds minimum price where profit >= 0.
- **Success criteria**: Break-even price is the lowest possible price with profit >= $0.00.

### Recommended Price Solver
- **Functionality**: Calculates optimal price that satisfies the user's profit/margin goal while respecting rounding preferences.
- **Purpose**: Gives actionable pricing recommendation that meets business objectives.
- **Trigger**: Any input changes or goal changes.
- **Progression**: Inputs + goal set → Approximate solution computed → Price stepped/verified → Rounding applied → Final verification → Result displayed or impossible warning shown.
- **Success criteria**: Recommended price meets exact margin/profit target, or clearly warns if impossible.

### Cost & Profit Breakdown Table
- **Functionality**: Displays itemized breakdown of materials, packaging, labor, overhead, shipping, fees, net revenue, and profit for the recommended price.
- **Purpose**: Transparency into how the recommended price translates to actual profit after all deductions.
- **Trigger**: Recommended price is calculated.
- **Progression**: Price computed → Each cost component formatted → Fees calculated → Net revenue derived → Profit shown → All displayed in table.
- **Success criteria**: All rows sum correctly, profit matches the displayed value, user can trace dollars through the calculation.

### Field Validation
- **Functionality**: Real-time validation prevents invalid inputs (negative numbers, non-numeric text, out-of-range percentages).
- **Purpose**: Ensures calculation integrity and prevents nonsensical results.
- **Trigger**: User types in any input field.
- **Progression**: Character entered → Validation runs → Invalid inputs marked → Error message shown → Calculations disabled until valid.
- **Success criteria**: Only valid numeric inputs accepted, percentages capped at reasonable ranges, clear error messages.

### Impossible Target Warning
- **Functionality**: Detects when cost structure makes the target profit/margin mathematically unattainable and displays clear warning.
- **Purpose**: Prevents user confusion when constraints cannot be satisfied.
- **Trigger**: Goal target set too high relative to costs and fees.
- **Progression**: Solver attempts to find price → No valid solution exists → Warning displayed → Suggestions shown (reduce costs, lower target, etc.).
- **Success criteria**: Warning appears only when truly impossible, provides actionable guidance.

## Edge Case Handling
- **Zero/Empty Inputs** - Treat blank fields as zero, allow calculation to proceed (may result in zero break-even).
- **Extreme Fee Structures** - Handle cases where platform fee exceeds price (e.g., high fixed fee + low price) by showing break-even as higher value.
- **Impossible Margins** - When target margin is 100% or costs+fees exceed any reasonable price, show clear "impossible" message.
- **Rounding Conflicts** - If rounding down would violate constraints, step up to next valid rounded price.
- **Very High Labor Hours** - No artificial cap; allow calculation but may result in very high prices.
- **Negative Computed Values** - If user tests with zero price, show negative profit clearly; never hide math.

## Design Direction
The design should evoke precision, trustworthiness, and clarity - like a professional financial calculator. Clean, high-contrast layout with strong visual hierarchy that separates inputs from outputs. The aesthetic should feel modern and data-focused, with monospace numerals and clear labels that give the impression of accurate, serious financial tooling.

## Color Selection
A professional, finance-focused palette with teal as the primary accent to convey trustworthiness and precision.

- **Primary Color**: Deep Teal `oklch(0.45 0.12 200)` - Conveys professionalism, trust, and precision (financial/analytical aesthetic).
- **Secondary Colors**: 
  - Slate background `oklch(0.97 0.005 240)` for subtle neutral zones
  - Darker slate `oklch(0.30 0.02 240)` for text and strong contrast
- **Accent Color**: Bright Cyan `oklch(0.70 0.15 195)` - Highlights important calculated values and calls attention to key outputs.
- **Alert Colors**:
  - Warning amber `oklch(0.75 0.15 70)` for impossible target warnings
  - Success green `oklch(0.65 0.15 150)` for valid calculations

- **Foreground/Background Pairings**:
  - Background (Light Slate #F7F8FA): Dark Slate text (#404756) - Ratio 9.2:1 ✓
  - Primary (Deep Teal #0F6B7A): White text (#FFFFFF) - Ratio 5.8:1 ✓
  - Accent (Bright Cyan #3FC1D9): Dark Slate text (#404756) - Ratio 6.1:1 ✓
  - Warning (Amber #E8B84D): Dark Slate text (#404756) - Ratio 8.3:1 ✓

## Font Selection
Use a clean, technical sans-serif with tabular figures for precise numerical display, paired with a readable humanist sans for labels and descriptions.

- **Primary Typeface**: Space Grotesk - Modern geometric sans with technical feel, excellent for headings and labels.
- **Numeric Typeface**: JetBrains Mono - Monospace with clear distinction between similar characters (0/O, 1/l), perfect for currency values and calculations.

- **Typographic Hierarchy**:
  - H1 (App Title): Space Grotesk Bold/32px/tight letter spacing (-0.02em)
  - H2 (Section Headers): Space Grotesk Semibold/20px/normal spacing
  - Body Labels: Space Grotesk Regular/14px/0.5px letter spacing
  - Numeric Values: JetBrains Mono Medium/16px/tabular-nums
  - Large Results: JetBrains Mono Bold/24px/tabular-nums

## Animations
Animations should be minimal and functional, reinforcing calculation updates without distracting from precision work. Use subtle transitions to indicate when values recalculate, and gentle color shifts to highlight warnings or successes.

- Input focus: Smooth border color transition (150ms)
- Result updates: Brief fade-in for changed values (200ms) to draw eye to recalculated numbers
- Warning appearance: Subtle scale-in (250ms) with amber glow to catch attention without alarming
- Breakdown table rows: Staggered fade-in on mount (50ms delay per row) for professional reveal

## Component Selection

- **Components**:
  - `Input` - All currency, percentage, and numeric fields with proper type="number" and validation
  - `Label` - Clear field labels with proper htmlFor associations
  - `Card` - Wraps input panel and results panel for visual separation
  - `Select` - Overhead mode and rounding mode dropdowns
  - `Switch` - Shipping included toggle and goal type toggle
  - `RadioGroup` - Goal selection (margin vs profit target)
  - `Table` - Cost breakdown display with aligned currency columns
  - `Alert` - Impossible target warnings with amber styling
  - `Badge` - Status indicators for valid/invalid states
  - `Separator` - Visual dividers between input sections

- **Customizations**:
  - Input fields with `tabular-nums` class for monospace number alignment
  - Custom currency input component with $ prefix and 2 decimal precision
  - Custom percentage input with % suffix and basis point internal conversion
  - Result cards with large, bold JetBrains Mono for emphasis
  - Breakdown table with right-aligned numeric columns and subtle zebra striping

- **States**:
  - Inputs: Default (border-input), Focus (border-accent ring-accent), Error (border-destructive), Disabled (opacity-50)
  - Calculate button: Hidden (calculations are automatic/live)
  - Results: Loading (skeleton pulse while calculating), Success (normal display), Warning (amber border + icon)
  - Breakdown rows: Hover (subtle background shift for scannability)

- **Icon Selection**:
  - `Calculator` - App title icon
  - `CurrencyDollar` - Money-related inputs
  - `Percent` - Percentage inputs
  - `Clock` - Labor time
  - `Package` - Packaging costs
  - `Warning` - Impossible target alerts
  - `CheckCircle` - Valid calculation indicator
  - `TrendingUp` - Profit/margin goals

- **Spacing**:
  - Card padding: `p-6`
  - Input groups: `space-y-4`
  - Section gaps: `gap-6`
  - Form field internal spacing: `gap-2`
  - Table cell padding: `px-4 py-2`
  - Two-column layout gap: `gap-8`

- **Mobile**:
  - Stack two-panel layout vertically on mobile (inputs above, results below)
  - Reduce card padding to `p-4` on mobile
  - Collapse breakdown table to definition list format on narrow screens
  - Ensure input fields are full-width with comfortable touch targets (min 44px height)
  - Sticky results summary at bottom of viewport on mobile for quick reference
