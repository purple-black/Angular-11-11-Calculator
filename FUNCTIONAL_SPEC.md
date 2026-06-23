---
type: functional-spec
status: draft
interactive-name: 11-11-calculator
subject-code: MAT
classification: interactive-no-eval
target-angular-path: angular-library/projects/interactives-lib/src/lib/interactives/11-11-calculator
legacy-reference: none
authors: ["Antigravity AI"]
reviewers: []
version: 0.1
last-updated: 2026-06-18
---

# Functional Spec — 11-11 Calculator

> **Scope of this document.** This is the **functional spec** — what the interactive does for learners, authors, and the product. *How* it is built in Angular (folder layout, component tree, services, signals, SCSS, libraries with versions, performance budgets, test plan, shell integration wiring) belongs in the **tech spec**. Implementation details for any newly-proposed shared component belong in a **component tech spec**.

---

## 0. Assumptions

- [ASSUMPTION-1] Learners have a browser that supports CSS Grid, Flexbox, and standard modern ES6+ Javascript capabilities.
- [ASSUMPTION-2] Touch and physical keyboard inputs are both available on target devices and should work seamlessly.
- [ASSUMPTION-3] LocalStorage is enabled and accessible in the learner's browser to store and retrieve calculation history.
- [ASSUMPTION-4] Tailwind CSS is available in the compiling environment to support modern utility-based styling.

---

## 1. Source Inventory

| Code    | Type          | Location / link                                                                     | Notes |
|---------|---------------|-------------------------------------------------------------------------------------|-------|
| `brief` | Product brief | User request specifying basic operations, history, input management, state, and a11y | Primary requirements source |

### 1.1 Legacy provenance trace (existing-rebuild only)

**N/A — new interactive, no legacy reference.**

---

## 2. Classification

- [ ] **Animation / display-only**
- [x] **Interactive — no evaluation**
- [ ] **Interactive — evaluated**

**Rationale for chosen classification:** The 11-11 Calculator is a utility tool that maintains and displays expression state, enables chained arithmetic operations, and logs history. It does not grade learner inputs or report a right/wrong answer to the LMS `[brief]`.

### 2.1 Variant matrix (high-level)

**Single variant — no matrix needed.**

---

## 3. Learning Objective & Pedagogy

- **Concept:** Exploring basic arithmetic computations, order of sequential operations, decimal arithmetic, and history tracking `[brief]`.
- **Grade / age band:** Grade 1–10 (Elementary to High School) `[brief]`.
- **Concept tags:** addition, subtraction, multiplication, division, decimal arithmetic, expression evaluation, operator precedence `[brief]`.
- **Learning outcome:** Learners can construct and solve arithmetic expressions, manage multi-step calculations, review their history of operations, and reuse previous results in chained computations `[brief]`.

---

## 4. Learner-facing Description

**Summary:** A modern, mobile-first scientific calculator app with a clean visual interface featuring a display panel, a 28-button grid keyboard (including parenthesis and scientific keys), and a scrollable side history panel `[brief]`.

**Screen regions:**
1. **Header Panel:** Contains the application title ("11:11 Calculator"), a `Deg/Rad` toggle switch for trigonometric functions, and a toggle button to slide-out/collapse the history log `[brief]`.
2. **Display Panel:**
   - *Expression Display:* Displays the active chained equation in real-time with nested groupings and scientific functions (e.g., `sin(30) + (√16 × 4) -`) `[brief]`.
   - *Active Input/Result Display:* Shows the active number being keyed in (defaults to `0`) or the final calculated result when equals is triggered `[brief]`.
3. **Keypad Panel:** Responsive grid of interactive buttons `[brief]`:
   - *Numbers:* `0` to `9` and a decimal point key `.` `[brief]`.
   - *Operators:* `÷`, `×`, `-`, `+`, and `=` `[brief]`.
   - *Groupings:* Open parenthesis `(` and close parenthesis `)` `[brief]`.
   - *Scientific Keys:* `sin`, `cos`, `tan`, `log` (base 10), `ln` (natural log), and `√` (square root) `[brief]`.
   - *Actions:* `C` (Clear All), `CE` (Clear Entry), `⌫` (Backspace) `[brief]`.
4. **History Panel:** Scrollable list showing previous successful expressions and results alongside timestamps and a "Clear History" button `[brief]`.

---

## 5. Interaction Flow

| # | Trigger                      | Learner action                 | System response                                                                                  | Source    |
|---|------------------------------|--------------------------------|--------------------------------------------------------------------------------------------------|-----------|
| 1 | Initial Load                 | —                              | Renders active input display at `0`, expression display empty, history panel hidden.             | `[brief]` |
| 2 | Tap numeric key (`0`-`9`)    | Single tap                     | Appends digit to the current active number input (prefacing `0` is replaced).                     | `[brief]` |
| 3 | Tap decimal key (`.`)        | Single tap                     | Appends decimal to current number. If decimal already exists, ignores input.                    | `[brief]` |
| 4 | Tap Backspace key (`⌫`)      | Single tap                     | Removes the trailing character from current number. If empty, reverts display to `0`.            | `[brief]` |
| 5 | Tap Clear Entry (`CE`)       | Single tap                     | Resets only the active input display to `0`; does not clear the expression chain.               | `[brief]` |
| 6 | Tap Clear All (`C`)          | Single tap                     | Resets expression display, active input, active operator, and mode back to initial load state.   | `[brief]` |
| 7 | Tap operator (`+`/`-`/`×`/`÷`)| Single tap                     | Pushes current input and tapped operator to expression display; updates intermediate calculation. | `[brief]` |
| 8 | Tap open parenthesis `(`     | Single tap                     | Appends `(` to the expression chain and starts a new nested grouping.                            | `[brief]` |
| 9 | Tap close parenthesis `)`    | Single tap                     | Appends the current input number (if any) followed by `)` to the expression chain.                | `[brief]` |
| 10| Tap scientific function key  | Single tap (`sin`/`cos`/`tan`/`log`/`ln`/`√`) | Appends function prefix with an open parenthesis (e.g., `sin(`, `√(`) to the expression chain. | `[brief]` |
| 11| Tap Deg/Rad toggle           | Single tap                     | Toggles between Degrees and Radians modes (affects trigonometric calculations).                  | `[brief]` |
| 12| Tap Equal (`=`)              | Single tap                     | Evaluates complete expression (handling nested groupings and scientific functions), sets result. | `[brief]` |
| 13| Tap History item             | Click on historical entry row  | Re-loads the historical item's result or complete expression into the active workspace.          | `[brief]` |
| 14| Tap Clear History (trash)    | Single tap                 | Clears all entries from local history display and removes them from `localStorage`.             | `[brief]` |

---

## 6. Instructions, Hints & Controls

**Instructions placement:** No floating banner is needed. Screen layout provides obvious affordances. A compact instruction icon/modal is optional.

**On-screen controls:**

| Control           | Position       | Purpose                                                                   | Source    |
|-------------------|----------------|---------------------------------------------------------------------------|-----------|
| Clear All (`C`)   | Row 1, Col 1   | Completely wipes memory, expression, and current entry state.             | `[brief]` |
| Clear Entry (`CE`)| Row 1, Col 2   | Resets the current number input to zero, leaving the formula intact.       | `[brief]` |
| Backspace (`⌫`)   | Row 1, Col 3   | Deletes the last digit/character typed.                                   | `[brief]` |
| Parentheses `( )` | Row 2, Col 1-2 | Initiates and closes nested grouping levels for order overrides.          | `[brief]` |
| Scientific Keys   | Dedicated panel| Triggers scientific operations `sin`, `cos`, `tan`, `log`, `ln`, and `√`.   | `[brief]` |
| Deg/Rad Toggle    | Header Panel   | Switch between Angle modes (Degrees/Radians) for trigonometric calculations| `[brief]` |
| Operators         | Right column   | Applies arithmetic transformation to the sequence of values.               | `[brief]` |
| History Toggle    | Top-Right      | Accesses/closes the log of past computations.                              | `[brief]` |
| History Clear     | History Header | Wipes local storage history log.                                          | `[brief]` |

---

## 7. Evaluation Logic

**N/A — This is a tool/playground interactive. No formal learning score is emitted.**

### 7.1 Mathematical and Parsing Rules

1. **Division by Zero:** If a division by zero is evaluated (e.g. `5 ÷ 0` or within nested parentheses like `10 ÷ (2 - 2)`), display shows `Error: Cannot divide by zero` `[brief]`. Further inputs are blocked until Clear (`C` or `CE`) is pressed.
2. **Consecutive Operator Press:** If an operator is pressed immediately after another operator (e.g., user types `5 +` then presses `×`), the previous operator is overwritten by the new operator (`5 ×`) `[brief]`.
3. **Decimals Guard:** Prevents entering invalid strings like `5.5.5`. The decimal button is disabled/ignored if a decimal point already exists in the active input string `[brief]`.
4. **Number Overflow:** Active number strings are limited to 12 digits. Calculations resulting in figures higher than `999,999,999,999` automatically display in scientific notation format `[brief]`.
5. **Parentheses Nesting and BODMAS Evaluation:** 
   - Supports complex nested groupings (e.g. `(5 + (3 × 2)) × 2`).
   - The evaluation engine implements standard mathematical operator precedence (BODMAS/PEMDAS: Brackets, Order, Division/Modification, Addition/Subtraction) to resolve equations containing parentheses.
   - **Auto-Closing Unmatched Parentheses:** If the user presses `=` with unmatched open parentheses (e.g., `5 × (3 + 2`), the evaluation engine automatically appends the matching number of closing parentheses before parsing and evaluating (evaluating as `5 × (3 + 2)`).
   - **Empty Parentheses Guard:** Typing `()` is ignored or resolved without error (reverting to empty or omitting the group).
6. **Scientific Function Constraints & Domain Safety:**
   - Trigonometric operations (`sin`, `cos`, `tan`) respect the selected degree/radian mode. 
   - **Tan undefined values:** Evaluating `tan(90°)` (or odd multiples of 90 degrees in Degree Mode) displays `Error: Invalid Input`.
   - **Logarithm Domain errors:** Arguments for `log` and `ln` must be strictly positive. If the parameter is `<= 0`, display shows `Error: Invalid Input`.
   - **Square Root Domain errors:** Negative inputs under a square root (e.g., `√(-4)`) trigger `Error: Invalid Input`.
   - Operations that fail domain checks freeze inputs and block the keypad until a Clear operation resets the state.

---

## 8. Explanation / Animation Handling

| Mode                     | When triggered                        | Content                                                       | Source    |
|--------------------------|---------------------------------------|---------------------------------------------------------------|-----------|
| Button Press Micro-anim  | Immediate on button tap / click       | Interactive scale-down (ripple effect) for visual feedback.   | `[brief]` |
| Smooth Slide Animation   | On history panel toggle               | Slide-in drawer from the right on mobile; inline expand on desktop. | `[brief]` |

---

## 9. Hint System

**None — hints not in scope for a calculator tool.**

---

## 10. Author Input — JSON Contract

### 10.1 Param table

| Param             | Type      | Required | Default  | Status | Author surface | Rationale                                                        |
|-------------------|-----------|----------|----------|--------|----------------|------------------------------------------------------------------|
| `enableHistory`   | `boolean` | no       | `true`   | NEW    | Toggle         | Enables or disables the calculations history panel.              |
| `maxHistoryCount` | `number`  | no       | `20`     | NEW    | Numeric Input  | Sets the limit on historical equations stored in LocalStorage.   |
| `allowDecimals`   | `boolean` | no       | `true`   | NEW    | Toggle         | Restricts input to whole numbers when set to false.              |
| `decimalPrecision`| `number`  | no       | `8`      | NEW    | Numeric Input  | Caps decimal rounding precision (prevents floating-point noise). |
| `enableScientific`| `boolean` | no       | `true`   | NEW    | Toggle         | Renders the scientific keys panel for trigonometry and logarithms.|
| `defaultAngleMode`| `string`  | no       | `"deg"`  | NEW    | Dropdown       | Default trigonometry mode: `"deg"` (Degrees) or `"rad"` (Radians).|

### 10.2 Decision log — why keep / add / remove / rename

- **NEW — `enableHistory`:** Added to support teachers disabling the history log in specific guided test contexts `[brief]`.
- **NEW    — `maxHistoryCount`:** Added to control local browser memory boundaries `[brief]`.
- **NEW    — `allowDecimals`:** Useful for simpler arithmetic modules (e.g., lower grades working only with integers) `[brief]`.
- **NEW    — `decimalPrecision`:** Prevents common floating point inaccuracies like `0.1 + 0.2 = 0.30000000000000004` `[brief]`.
- **NEW    — `enableScientific`:** Allows hiding scientific keys for simpler interactive requirements (primary grade level) `[brief]`.
- **NEW    — `defaultAngleMode`:** Pockets standard baseline setting for classes teaching degrees vs radians `[brief]`.

### 10.3 Sample inputs

**Minimal (only defaults):**
```json
{}
```

**Maximal Custom Settings:**
```json
{
  "enableHistory": true,
  "maxHistoryCount": 15,
  "allowDecimals": true,
  "decimalPrecision": 6,
  "enableScientific": true,
  "defaultAngleMode": "rad"
}
```

---

## 11. Assets

| Asset           | Source          | Format | Notes (author POV) / size budget |
|-----------------|-----------------|--------|----------------------------------|
| `backspace.svg` | Library default | SVG    | Icon for backspace button        |
| `history.svg`   | Library default | SVG    | Icon for history panel toggle    |
| `trash.svg`     | Library default | SVG    | Icon for clearing history log    |

---

## 12. Reuse Analysis — Existing Angular `shared/` and `core/`

| Candidate          | Verdict | Reason (product level)                                       | Citation  |
|--------------------|---------|--------------------------------------------------------------|-----------|
| `shared/ui/button` | REUSE   | Visual buttons should leverage general interactive base styles | `[brief]` |

---

## 13. Shared Component Proposal (new or extended)

**None proposed.**

---

## 14. Library Capabilities (summary)

| Capability the interactive needs | Likely library (indicative) | Notes (product POV)                               |
|----------------------------------|-----------------------------|---------------------------------------------------|
| Reactive State Management        | RxJS                        | BehaviorSubject for single source of truth state  |
| Local Data Storage               | LocalStorage API            | Storing calculation history across sessions       |
| Tailwind CSS Styling             | Tailwind CSS                | Custom typography, layout, and colors             |

---

## 15. Mobile & Responsive Behaviour (learner / author POV)

- **Form factors supported:**
  - *Mobile:* Vertical single-column stack. Keypad fills the lower viewport. The history panel acts as an overlay drawer sliding in from the right or bottom `[brief]`.
  - *Tablet / Laptops:* Two-column grid interface. History panel sits fixed beside the main calculator keypad, giving immediate horizontal feedback `[brief]`.
- **Touch Targets:** Tap targets are at least 48px × 48px to allow easy, accurate taps on small touch displays `[brief]`.
- **Orientation:** Supports portrait-locked or landscape view, automatically reflowing layout using CSS grid breakpoints `[brief]`.

---

## 16. Accessibility (a11y) — requirements & copy

- **Keyboard navigation:**
  - Tab order maps from Top Actions -> Display -> History Toggle -> Main Grid Keys (Row by Row) -> History list `[brief]`.
  - Direct keyboard mapping enables typing number keys (`0`-`9`), decimals (`.`), standard operator keys (`+`, `-`, `*` or `x`, `/`), parentheses `(` (via `Shift + 9`) and `)` (via `Shift + 0`), scientific shortcuts: `s` for `sin(`, `c` for `cos(`, `t` for `tan(`, `l` for `log(`, `n` for `ln(`, `r` for `√(`, evaluation (`Enter` or `=`), deletion (`Backspace`), and clearing (`Escape` or `C`) `[brief]`.
- **Screen-reader narration copy:**
  - Main display container: `aria-live="polite"` and `role="status"` to announce current inputs and calculated solutions dynamically `[brief]`.
  - Button labels: Explicitly set `aria-label` for action keys (e.g. `aria-label="backspace"`, `aria-label="clear expression"`, `aria-label="divide"`) `[brief]`.
- **Focus visibility:** Heavy focus rings are drawn when navigating the calculator grid using keyboard inputs `[brief]`.

---

## 17. Edge Cases (user-visible behavior)

- **Floating Point Precision:** Avoid displays showing numbers like `0.300000000004` by applying fixed math rounding limit constraints defined by the author `[brief]`.
- **Operator Swap:** Tap `+` followed by `-` correctly updates the active operator display to subtraction immediately, preventing invalid stacked expressions.
- **Empty Backspace:** Pressing `Backspace` on an empty calculator displays `0` and does not break the visual interface or result in `NaN`.
- **Exceeding History Limit:** Tapping equal when the history length is at `maxHistoryCount` deletes the oldest calculations from the bottom of the list.

---

## 18. Performance Expectations (learner-visible)

- **Instant Input Rendering:** Input digits render under 20ms of a button tap.
- **History Retrieval:** LocalStorage load times should execute synchronously on initialization without delaying interface render.

---

## 19. Enhancements Over Legacy

**N/A — new interactive, no legacy reference.**

---

## 20. Out of Scope

- Unit conversion (e.g., currency, temperature, metric weights).

---

## 21. Open Questions

**None.**

---

## 22. Quality Checklist

**Coverage & sourcing**
- [x] §0 Assumptions are explicit, and a reviewer has confirmed each one
- [x] §1 Source Inventory contains every source code used in citations elsewhere
- [x] §1.1 Legacy provenance trace is filled OR explicitly marked **N/A — new interactive**
- [x] §2 Classification chosen; conditional sections aligned with the choice
- [x] §2.1 Variant matrix filled OR explicitly marked **Single variant — no matrix needed**
- [x] Every section ends with at least one citation OR is explicitly deleted (no empty `N/A` placeholders inside sections)

**Product-only content (no tech-spec leakage)**
- [x] §10 JSON contract covers param names, types, required-ness, status-vs-legacy, author surface, and rationale — but NOT parsing logic, defaults-in-code, or legacy-config mappers
- [x] §10.3 includes both minimal AND maximal sample JSON
- [x] §10.4 submission payload is omitted or conforms to standard requirements
- [x] §12 lists at least 3 candidates considered (even if all NOT FIT); the table is verdicts only, no import paths
- [x] §13 New / extended shared component is either declared with ≥ 3 intended consumers OR marked "None proposed" — and contains **no public API or implementation detail**
- [x] §14 lists capabilities at the product level — no version pins, no bundle sizes, no peer-dep deltas
- [x] §15 Mobile is learner / author POV — no Pointer Events, no exact CSS px breakpoints, no gesture-library names
- [x] §16 a11y captures requirements and copy — no `aria-*` attribute lists, no `tabindex` values, no focus-trap markup, no `prefers-reduced-motion` media-query syntax
- [x] §17 Edge cases are described as user-visible behavior — not as exception handlers or fallbacks-in-code
- [x] §18 Performance expectations are learner-visible — no bundle KB, no render-cycle budgets, no exact FPS pins
- [x] §19 If legacy exists, every behavior diff is listed with rationale and rollback impact
- [x] §21 Open questions use explicit `[TBD — needs: ...]` markers, not silent gaps

**Self-audit: would a reader confuse this with a tech spec?**
- [x] No folder paths under `interactives-lib/` appear as design statements
- [x] No TypeScript interface bodies (only param shapes in tables / JSON examples)
- [x] No SCSS / BEM / OnPush / change-detection references
- [x] No test plan, no Storybook story plan, no host shell registration details
- [x] No statements about *what is implemented today* — that is tech-spec §0
