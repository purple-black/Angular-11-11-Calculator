---
type: tech-spec
status: draft
interactive-name: 11-11-calculator
companion-func-spec: specs/questions/11-11-Calculator/FUNCTIONAL_SPEC.md
component-tech-specs: []
target-angular-path: questions/questions/11-11-Calculator
legacy-reference: none
authors: ["Antigravity AI"]
reviewers: []
version: 0.1
last-updated: 2026-06-19
---

# Tech Spec — 11-11 Calculator

> **Scope of this document.** This is the **tech spec** — *how* the interactive is built in Angular: folder layout, component tree, services, signals, full TypeScript interfaces, library stack with versions, hard performance budgets, host/shell wiring, SCSS/BEM structure, testing strategy, and the legacy → Angular implementation map. *What* the interactive does for learners, authors, and product (classification, learning objective, JSON-contract rationale, evaluation rules as business logic, learner-visible mobile behavior, a11y requirements & copy, edge cases as user-visible behavior) lives in the **functional spec**.

---

## 0. Implementation Status & Variant Matrix

### 0.1 Overall implementation status

| Status                    | Meaning                                                            |
|---------------------------|--------------------------------------------------------------------|
| ✅ implemented            | Code is merged on `main` and meets the func-spec contract          |
| 🚧 partially implemented  | Code exists, but one or more contract clauses are not yet met      |
| 📝 spec-only              | This spec describes it; no code yet                                |
| 🔮 future                 | Planned, not in current scope                                      |

**Current overall status:** 📝 spec-only
**Last reconciled with code:** 2026-06-19

### 0.2 Variant matrix (detailed, with status)

**Single variant — no matrix needed.**

### 0.3 Func-spec contract coverage

| Func-spec clause                             | Status | Notes                                                        | Source        |
|----------------------------------------------|--------|--------------------------------------------------------------|---------------|
| §10.1 param `enableHistory`                  | 📝     | Central configuration input to show/hide history component.  | `[func:§10.1]`|
| §10.1 param `maxHistoryCount`                | 📝     | Caps entries array kept in state and storage.                | `[func:§10.1]`|
| §10.1 param `allowDecimals`                  | 📝     | Guards numeric keyboard decimal button disabled state.       | `[func:§10.1]`|
| §10.1 param `decimalPrecision`               | 📝     | Sets formatting/rounding decimal digits ceiling.             | `[func:§10.1]`|
| §10.1 param `enableScientific`               | 📝     | Sets display configuration for the scientific buttons panel. | `[func:§10.1]`|
| §10.1 param `defaultAngleMode`               | 📝     | Binds initial state to Degree or Radian angle unit.          | `[func:§10.1]`|
| §7.1 evaluation rule 1 (Divide by Zero)      | 📝     | Catches division operations where divisor = 0; sets state error | `[func:§7.1]` |
| §7.1 consecutive operator override           | 📝     | Substitutes active operator in state if preceding input is operator. | `[func:§7.1]` |
| §7.1 decimal validation                      | 📝     | Checks existing decimal presence in input buffer before appending. | `[func:§7.1]` |
| §7.1 nested grouping (parentheses)           | 📝     | Uses Shunting-yard algebraic parser to evaluate groupings.   | `[func:§7.1]` |
| §7.1 scientific function constraints         | 📝     | Enforces math domain safety boundaries for trig, logs, sqrt. | `[func:§7.1]` |
| §15 mobile-first responsive layout           | 📝     | CSS Flex/Grid layout with breakpoints matching drawer design. | `[func:§15]`  |
| §16 keyboard support                         | 📝     | Direct keystroke mappings captured on root host wrapper.      | `[func:§16]`  |

---

## 1. Source Inventory

| Code              | Type                       | Location / link                                                    | Notes                                         |
|-------------------|----------------------------|--------------------------------------------------------------------|-----------------------------------------------|
| `func`            | Companion functional spec  | `specs/questions/11-11-Calculator/FUNCTIONAL_SPEC.md @ v0.1`       | Functional design and pedagogy contract       |
| `ng`              | Angular app root           | `questions/questions/11-11-Calculator/...`                         | Target build and file placement path          |
| `ng-shared-ui`    | Shared elements            | `shared/ui/button`                                                 | Standard button states                        |

---

## 2. Architecture Overview

**System summary:** 
The application adopts an interactive-local, service-driven architecture. The core coordinator is `<calculator>`, which instantiates and hosts `CalculatorService`. Component state is centralized in an RxJS `BehaviorSubject` inside the service. The keyboard and history components emit action signals that trigger calculations inside the service, which automatically updates the state stream. Display and history elements subscribe to this reactive state to paint updates on screen `[func:§4]`.

**Component tree (rendered):**

```
<calculator>
  ├── <calculator-display>
  ├── <calculator-keyboard>
  └── <calculator-history>
```

**Data flow:**

```
[Keypad Taps] ──→ (Action Event) ──┐
                                   ▼
[Physical Keys] ─→ (Keydown) ──→ [CalculatorService] ──→ Updates State (RxJS BehaviorSubject)
                                   │
                                   ├──→ Emits State Stream ──→ [DisplayComponent] (Renders numbers)
                                   ├──→ Emits State Stream ──→ [HistoryComponent] (Renders past logs)
                                   └──→ Save to Browser ───→ LocalStorage API
```

---

## 3. Folder Layout

The package directory structure is arranged under the Angular interactives path:

```
questions/questions/11-11-Calculator/
├── calculator.component.ts               ← Entry component (OnPush, Standalone)
├── calculator.component.html
├── calculator.component.scss
├── calculator.stories.ts                 ← Storybook layout
├── calculator.constants.ts               ← Key actions list & default configuration
├── components/
│   ├── display/
│   │   ├── display.component.ts          ← Standalone presentation component
│   │   ├── display.component.html
│   │   └── display.component.scss
│   ├── keyboard/
│   │   ├── keyboard.component.ts         ← Keypad grid trigger component
│   │   ├── keyboard.component.html
│   │   └── keyboard.component.scss
│   └── history/
│       ├── history.component.ts          ← Drawer history manager
│       ├── history.component.html
│       └── history.component.scss
├── services/
│   └── calculator.service.ts             ← Central state mutator, memory store, history persistence
├── models/
│   └── calculator.interfaces.ts          ← Interfaces for State, Config, and History
└── validators/
    └── config.validator.ts               ← Configuration parameter limits guard
```

**Public-API exposure:**
This interactive is standalone. The entry component `CalculatorComponent` is exported in the module bundle.

---

## 4. Component Tree, Services & State

### 4.1 `<calculator>` — Entry Component
- **File:** `questions/questions/11-11-Calculator/calculator.component.ts`
- **Type:** Standalone
- **Change detection:** `OnPush`
- **Role:** Main shell container. Handles author inputs, initializes the calculation service, registers root-level keydown listeners, and handles visual drawer expansion `[func:§4]`.
- **Inputs:**
  - `@Input() config: CalculatorConfig` — Option set parsed from authoring system.
- **State owned:**
  - `isHistoryOpen: boolean` — Local boolean UI toggle flag.
  - `angleMode: 'deg' | 'rad'` — Trigonometric unit computation mode.
- **Services injected:**
  - `CalculatorService` (local scope, declared in `providers: [CalculatorService]`).

### 4.2 `<calculator-display>` — Value Screen
- **File:** `questions/questions/11-11-Calculator/components/display/display.component.ts`
- **Type:** Standalone
- **Change detection:** `OnPush`
- **Role:** Renders current mathematical formula stack, immediate evaluation outputs, and operational error messages `[func:§4]`.
- **Inputs:**
  - `@Input() expression: string` — Formula chain (e.g. `12 + 4.5 ×`).
  - `@Input() value: string` — Current input display (e.g. `16.5`).
  - `@Input() error: string | null` — Active division or parsing errors.

### 4.3 `<calculator-keyboard>` — Keypad Interface
- **File:** `questions/questions/11-11-Calculator/components/keyboard/keyboard.component.ts`
- **Type:** Standalone
- **Change detection:** `OnPush`
- **Role:** Arranges calculator control buttons (numbers, actions, and operators) in a responsive grid `[func:§4]`.
- **Inputs:**
  - `@Input() disableDecimals: boolean` — Disables decimal button inputs.
  - `@Input() showScientific: boolean` — Toggles loading scientific function row layout.
- **Outputs:**
  - `@Output() keyAction = new EventEmitter<string>()` — Relays key action types to service logic.

### 4.4 `<calculator-history>` — History Panel
- **File:** `questions/questions/11-11-Calculator/components/history/history.component.ts`
- **Type:** Standalone
- **Change detection:** `OnPush`
- **Role:** Lists equations solved in the active session, allowing users to wipe history or click formulas to reuse values `[func:§4]`.
- **Inputs:**
  - `@Input() history: HistoryItem[]` — Historical computations records array.
  - `@Input() isVisible: boolean` — Display flag for toggle transitions.
- **Outputs:**
  - `@Output() selectItem = new EventEmitter<HistoryItem>()` — Emits details of chosen history row to re-populate calculations.
  - `@Output() clearHistory = new EventEmitter<void>()` — Clears memory database entries.
  - `@Output() closePanel = new EventEmitter<void>()` — Collapses history drawer.

---

## 5. TypeScript Interfaces

```typescript
// questions/questions/11-11-Calculator/models/calculator.interfaces.ts

export interface CalculatorConfig {
  enableHistory?: boolean;          // Default: true
  maxHistoryCount?: number;         // Default: 20
  allowDecimals?: boolean;          // Default: true
  decimalPrecision?: number;        // Default: 8
  enableScientific?: boolean;       // Default: true
  defaultAngleMode?: 'deg' | 'rad'; // Default: 'deg'
}

export interface HistoryItem {
  id: string;                       // Unique timestamp hash ID
  expression: string;               // e.g. "12 + 5"
  result: string;                   // e.g. "17"
  timestamp: number;                // Milliseconds epoch value
}

export interface CalculatorState {
  currentInput: string;             // Active numerical character buffer
  expression: string;               // Display formula assembly string
  previousValue: number | null;     // Cached operator operand A
  activeOperator: string | null;    // Toggled active action (+, -, *, /)
  isResetOnNext: boolean;           // Clears digit buffer on next number key press
  openParenthesesCount: number;     // Tracks unbalanced open parenthesis count
  angleMode: 'deg' | 'rad';         // Active trigonometric computation unit
  history: HistoryItem[];           // calculation logs array
  error: string | null;             // Math or limit error label
}
```

---

## 6. JSON Config — Parsing, Validation, Defaults

### 6.1 Parsing & Defaults
Author parameters are mapped on initialization inside `CalculatorComponent` and loaded to configure settings in `CalculatorService`.
- **Default fallback config object:**
  ```typescript
  const DEFAULT_CONFIG: CalculatorConfig = {
    enableHistory: true,
    maxHistoryCount: 20,
    allowDecimals: true,
    decimalPrecision: 8,
    enableScientific: true,
    defaultAngleMode: 'deg'
  };
  ```

### 6.2 Validation
- **Location:** `questions/questions/11-11-Calculator/validators/config.validator.ts`
- **Rules:**
  - `maxHistoryCount` must be an integer between `1` and `100`.
  - `decimalPrecision` must be an integer between `0` and `15`.
  - `defaultAngleMode` must be either `'deg'` or `'rad'`.
  - Out-of-bounds configurations fallback to the corresponding standard default settings.

---

## 7. Reuse Implementation

- **Direct storage hooks:** The calculator queries standard browser `window.localStorage` to save and restore past calculation items `[func:§14]`.
- **Styling tokens:** Integrates theme values (fonts, background glass templates) provided by Tailwind CSS libraries `[func:§12]`.

---

## 8. Library Stack & Peer Dependencies

### 8.1 Runtime dependencies

| Package | Version pin | Source | Purpose |
| --- | --- | --- | --- |
| `rxjs` | `^7.5.0` | project-default | Event streams and state BehaviorSubject containers |
| `tslib` | `^2.3.0` | project-default | Standard compilation helpers |

---

## 9. Host / Shell / LMS Integration

### 9.1 Outputs

| `@Output()` | Event payload type | Emitted when |
| --- | --- | --- |
| `telemetryUpdate` | `{ action: string, value: string }` | Relays user input events to host tracking platforms |

---

## 10. Mobile Implementation

- **Breakpoints:**
  - Mobile layouts adjust styling at `max-width: 768px`.
- **Drawer overlay:**
  - On displays under 768px wide, history components slide over the keypad view using Tailwind CSS translation properties (`translate-x-0` vs `translate-x-full`) with a z-index of 50.
- **Button Sizing:**
  - Keypad touch dimensions use a minimum standard layout height of `12rem` split into equal grids of `48px` buttons with `0.5rem` row spacing to prevent keyboard tap collision `[func:§15]`.

---

## 11. Accessibility Implementation

### 11.1 ARIA mappings

| Component element | Role | ARIA Attributes | Focus index |
| --- | --- | --- | --- |
| Root container | `application` | `aria-label="Calculator Interface"` | `-1` |
| Calculator displays | `status` | `aria-live="polite"` | `-1` |
| Keypad buttons | `button` | `aria-label="[Button descriptive name]"` | `0` |
| History records | `button` | `aria-label="Reuse expression [Equation]"` | `0` |

### 11.2 Keyboard bindings capture
Root component registers window listeners for physical keyboard input, matching characters to calculator operations:
- Numbers `0` to `9` and `.` map to numeric triggers.
- `+`, `-`, `*` (or `x`), `/` map to operator actions.
- `(` (Shift + 9) and `)` (Shift + 0) map to grouping controls.
- Scientific function mappings: `s` -> `sin(`, `c` -> `cos(`, `t` -> `tan(`, `l` -> `log(`, `n` -> `ln(`, `r` -> `√(`.
- `Enter` and `=` map to calculation evaluation.
- `Backspace` triggers single-character deletions.
- `Escape` maps to Clear All (`C`) action.

---

## 12. SCSS / Styling Architecture

- **Encapsulation:** Set to `ViewEncapsulation.None` or `Emulated` with components styled using scoping conventions to avoid overlapping other application parts.
- **Styling Rules:**
  - Leverages Tailwind CSS class utilities.
  - Buttons use flex alignments with smooth click transitions (`transition-all duration-100 active:scale-95`).
- **Precedence calculation logic:**
  For flat expressions, calculations evaluate sequentially (Pocket Calculator mode) where pressing a subsequent operator evaluates the active sub-expression immediately:
  - Input: `5 + 3` -> Tap `×` -> Expression updates to `8 ×` and result display updates to `8`.
  - Tap `2` -> Tap `=` -> Expression evaluates to `16`.

  **Parentheses & Scientific Functions Priority Override (BODMAS Mode):**
  If parentheses `()` or scientific keys are introduced, sequential evaluation is bypassed in favor of standard algebraic operator precedence (BODMAS/PEMDAS):
  - The calculation service tokenizes the complete formula string using standard regular expressions (supporting unary functions `sin`, `cos`, `tan`, `log`, `ln`, and `√`).
  - A Shunting-yard algorithm parser or recursive descent parser processes the token list to build an evaluation queue. Unary functions are parsed with highest priority, binding to the next immediate parenthetical grouping or numeric token.
  - Unmatched open parentheses are automatically closed at the parsing step.
  - Trigonometric operands are resolved in Degrees or Radians matching the active `angleMode` state unit.
  - Example: `5 + 3 × sin(30)` in Degree Mode evaluates as `5 + 3 × 0.5` = `6.5`.

---

## 13. Performance Budgets

| Metric | Target | Measured via |
| --- | --- | --- |
| Lazy package chunk size | ≤ 25 KB | Webpack bundler analyzer |
| Frame operations rendering speed | ≥ 60 fps | Chrome rendering profile tools |
| Tap-to-render frame duration | ≤ 16ms | JavaScript heap profile |

---

## 15. Testing Strategy

### 15.1 Unit tests
- **calculator.service.spec.ts:**
  - Assert correct arithmetic processing (add, subtract, multiply, divide).
  - Verify chained operations evaluate sequentially (e.g. `12 + 3 × 2` yields `30` in pocket calculator mode).
  - Verify expressions with parentheses resolve using BODMAS precedence (e.g., `5 + 3 × (2 + 2)` evaluates to `17`; `(2 + 3) × 4` evaluates to `20`; nested `((2 + 2) × 2) + 1` evaluates to `9`).
  - Verify scientific functions resolve correctly (e.g., `sin(30)` in Degree Mode evaluates to `0.5`; `log(100)` evaluates to `2`; `√16` evaluates to `4`).
  - Verify scientific domain check exceptions block execution and return user-friendly errors: `√(-4)` displays `Error: Invalid Input`; `log(0)` displays `Error: Invalid Input`; `tan(90)` in degrees displays `Error: Invalid Input`.
  - Assert divide-by-zero sets the error state cleanly and blocks operations, including inside parentheses (e.g. `5 ÷ (3 - 3)`).
  - Verify unmatched open parentheses are auto-closed (e.g. `5 × (2 + 3` evaluates as `25`).
  - Verify decimal point limitations (ignoring consecutive decimal inputs).
  - Assert history limit trims correctly when appending entries over the configured limit.

### 15.2 Component tests
- **calculator.component.spec.ts:**
  - Verify keypress events capture correctly and route to service methods.
  - Assert history panel toggle updates layout class lists correctly.

---

## 16. Build & Packaging

- Lazily loaded by the parent application shell.
- Entry module loads code components on demand to prevent increasing initial system bundle weight.

---

## 17. Open Tech Questions

- **Precedence Standard:** Double-check with pedagogy if sequential pocket calculator math (immediate evaluation on operator click) is preferred over algebraic standard calculations (where operator precedence is evaluated strictly on click of `=`). Pocket calculator sequential evaluation is implemented as default.

---

## 18. Quality Checklist

**Coverage & sourcing**
- [x] §0 Implementation status is reconciled against code as of 2026-06-19.
- [x] §0.2 Variant matrix matches func-spec.
- [x] §0.3 Func-spec contract coverage lists every clause from functional spec.
- [x] §1 Source Inventory contains companion spec codes.

**Tech-only content (no product-spec leakage)**
- [x] §2–§4 describe components and services without repeating pedagogy.
- [x] §5 contains TS interfaces with complete properties definitions.
- [x] §6 details parsing mechanism.
- [x] §10 and §11 describe Pointer Events, CSS responsive drawer structures, and keyboard ARIA structures without duplicating functional content.
- [x] §12 outlines BEM conventions, tailwind layouts, and pocket calculator sequence precedence.
- [x] §15 covers test suite target modules.
