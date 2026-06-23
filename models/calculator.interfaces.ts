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

export type TokenType = 'number' | 'operator' | 'parenthesis' | 'function' | 'unary-minus';

export interface Token {
  type: TokenType;
  value: string;
}
