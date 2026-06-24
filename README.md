An interactive scientific calculator built with Angular 21, RxJS, and Tailwind CSS. It supports standard pocket-calculator execution, strict BODMAS/algebraic parsing, evaluation history log management, and full keyboard/touch-device compatibility.

## Features

### Scientific Operations & Safety: 
Supports trigonometric functions (sin, cos, tan), base-10 logarithm (log), natural logarithm (ln), and square root (√). Includes built-in safety boundaries (e.g. preventing negative square roots, division by zero, or invalid tangent operations).
### Radian & Degree Modes:
Toggleable angle modes affecting all trigonometric functions, with visual indicators.
### Persistent calculation history:
A scrollable history panel displaying past computations with timestamps. Integrates with the browser's localStorage to preserve history between page reloads, capping records automatically based on configuration.
### Modern Responsive Design:
A mobile-first interface optimized for touch devices (minimum target size of 48px), showing as a vertical mobile card layout on smaller viewports and integrating inline columns on desktop viewports.
### A11y Compliant:
Supports full keyboard navigation (including shortcuts for scientific operators), visual focus indicators, and aria-live="polite" display readouts for screen-reader users.

## Tech Stack & Architecture
Framework: Angular 21 (Standalone Components & OnPush Change Detection)
Styling: Tailwind CSS (Utility classes & @apply rules)
State Management: Decentralized, reactive state managed via an RxJS BehaviorSubject inside the CalculatorService (serving as the single source of truth).
Expression Parsing: An implementation of the Shunting-Yard algorithm tokenizes and evaluates complex formulas with parenthetical groups.


