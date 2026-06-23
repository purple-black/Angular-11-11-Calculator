import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CalculatorConfig, CalculatorState, HistoryItem, Token } from '../models/calculator.interfaces';
import { DEFAULT_CONFIG } from '../calculator.constants';
import { validateConfig } from '../validators/config.validator';

@Injectable()
export class CalculatorService {
  private config: CalculatorConfig = DEFAULT_CONFIG;
  private rawTokens: Token[] = [];
  
  private stateSubject = new BehaviorSubject<CalculatorState>({
    currentInput: '0',
    expression: '',
    previousValue: null,
    activeOperator: null,
    isResetOnNext: false,
    openParenthesesCount: 0,
    angleMode: 'deg',
    history: [],
    error: null
  });

  public state$: Observable<CalculatorState> = this.stateSubject.asObservable();

  constructor() {
    this.loadHistoryFromStorage();
  }

  /**
   * Set configuration options parsed from author inputs
   */
  public setConfig(config: Partial<CalculatorConfig> | null | undefined): void {
    this.config = validateConfig(config);
    const currentState = this.stateSubject.value;
    
    // Update state to match default configurations
    const updatedHistory = this.limitHistory(currentState.history, this.config.maxHistoryCount || 20);
    this.stateSubject.next({
      ...currentState,
      angleMode: this.config.defaultAngleMode || 'deg',
      history: updatedHistory
    });
  }

  /**
   * Main entry point for keypad and physical keyboard actions
   */
  public handleKey(key: string): void {
    const state = this.stateSubject.value;

    // If application has failed math or domain checks, freeze inputs until reset
    if (state.error && key !== 'C' && key !== 'CE') {
      return;
    }

    switch (key) {
      case '0': case '1': case '2': case '3': case '4':
      case '5': case '6': case '7': case '8': case '9':
        this.handleDigit(key);
        break;
      case '.':
        this.handleDecimal();
        break;
      case '+': case '-': case '*': case '/':
      case '×': case '÷':
        const standardOp = key === '×' ? '*' : key === '÷' ? '/' : key;
        this.handleOperator(standardOp);
        break;
      case '(':
        this.handleOpenParenthesis();
        break;
      case ')':
        this.handleCloseParenthesis();
        break;
      case 'sin': case 'cos': case 'tan':
      case 'log': case 'ln': case '√':
        const standardFn = key === '√' ? 'sqrt' : key;
        this.handleScientific(standardFn);
        break;
      case '⌫': case 'Backspace':
        this.handleBackspace();
        break;
      case 'CE':
        this.handleClearEntry();
        break;
      case 'C':
        this.handleClearAll();
        break;
      case '=': case 'Enter':
        this.evaluateExpression();
        break;
      default:
        // Ignore unrecognized keys
        break;
    }
  }

  /**
   * Toggle Degree vs Radian units
   */
  public toggleAngleMode(): void {
    const currentState = this.stateSubject.value;
    const nextMode = currentState.angleMode === 'deg' ? 'rad' : 'deg';
    this.stateSubject.next({
      ...currentState,
      angleMode: nextMode
    });
  }

  /**
   * Clear computation history log
   */
  public clearHistory(): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      history: []
    });
    this.saveHistoryToStorage([]);
  }

  /**
   * Reload expression or result from a history log row
   */
  public selectHistoryItem(item: HistoryItem): void {
    const state = this.stateSubject.value;
    if (state.error) return;

    // Parse the result or complete expression into active state
    // Let's reset the active workspace and fill it with the history result
    this.rawTokens = [];
    this.stateSubject.next({
      ...state,
      currentInput: item.result,
      expression: '',
      previousValue: parseFloat(item.result),
      activeOperator: null,
      isResetOnNext: true,
      openParenthesesCount: 0
    });
  }

  /* --- Key action handlers --- */

  private handleDigit(digit: string): void {
    const state = this.stateSubject.value;
    let nextInput = state.currentInput;

    if (state.isResetOnNext || nextInput === '0') {
      nextInput = digit;
    } else {
      // Check 12 digit limits
      const digitCount = nextInput.replace(/[^0-9]/g, '').length;
      if (digitCount >= 12) {
        return; // Limit exceeded
      }
      nextInput += digit;
    }

    this.stateSubject.next({
      ...state,
      currentInput: nextInput,
      isResetOnNext: false
    });
  }

  private handleDecimal(): void {
    if (!this.config.allowDecimals) return;

    const state = this.stateSubject.value;
    let nextInput = state.currentInput;

    if (state.isResetOnNext) {
      nextInput = '0.';
    } else if (!nextInput.includes('.')) {
      nextInput += '.';
    }

    this.stateSubject.next({
      ...state,
      currentInput: nextInput,
      isResetOnNext: false
    });
  }

  private handleOperator(operator: string): void {
    const state = this.stateSubject.value;
    
    // Push current input number buffer first if present
    this.pushCurrentInputToTokens();

    if (this.rawTokens.length === 0) {
      // If we press minus at the start, treat it as starting a number with minus
      if (operator === '-') {
        this.stateSubject.next({
          ...state,
          currentInput: '-',
          isResetOnNext: false
        });
        return;
      }
      // Otherwise, default operand A to 0
      this.rawTokens.push({ type: 'number', value: '0' });
    }

    const lastToken = this.rawTokens[this.rawTokens.length - 1];

    if (lastToken.type === 'operator') {
      // Consecutive operator press: swap previous operator
      this.rawTokens[this.rawTokens.length - 1] = { type: 'operator', value: operator };
    } else {
      // Standard operator insertion
      this.rawTokens.push({ type: 'operator', value: operator });
    }

    this.updateStateAfterTokenMutation(operator);
  }

  private handleOpenParenthesis(): void {
    const state = this.stateSubject.value;

    // Check if we need implicit multiplication: e.g. 5( -> 5 * (
    this.insertImplicitMultiplicationIfNeeded();

    this.rawTokens.push({ type: 'parenthesis', value: '(' });

    this.stateSubject.next({
      ...state,
      currentInput: '0',
      isResetOnNext: true,
      openParenthesesCount: state.openParenthesesCount + 1,
      expression: this.getExpressionDisplay()
    });
  }

  private handleCloseParenthesis(): void {
    const state = this.stateSubject.value;
    if (state.openParenthesesCount <= 0) return;

    this.pushCurrentInputToTokens();

    this.rawTokens.push({ type: 'parenthesis', value: ')' });

    this.stateSubject.next({
      ...state,
      currentInput: '0',
      isResetOnNext: true,
      openParenthesesCount: Math.max(0, state.openParenthesesCount - 1),
      expression: this.getExpressionDisplay()
    });
  }

  private handleScientific(func: string): void {
    const state = this.stateSubject.value;
    if (!this.config.enableScientific) return;

    // Check implicit multiplication: e.g. 5sin( -> 5 * sin(
    this.insertImplicitMultiplicationIfNeeded();

    this.rawTokens.push({ type: 'function', value: func });
    this.rawTokens.push({ type: 'parenthesis', value: '(' });

    this.stateSubject.next({
      ...state,
      currentInput: '0',
      isResetOnNext: true,
      openParenthesesCount: state.openParenthesesCount + 1,
      expression: this.getExpressionDisplay()
    });
  }

  private handleBackspace(): void {
    const state = this.stateSubject.value;
    let nextInput = state.currentInput;

    if (nextInput.length > 0 && nextInput !== '0') {
      nextInput = nextInput.slice(0, -1);
      if (nextInput === '' || nextInput === '-') {
        nextInput = '0';
      }
    } else {
      nextInput = '0';
    }

    this.stateSubject.next({
      ...state,
      currentInput: nextInput
    });
  }

  private handleClearEntry(): void {
    const state = this.stateSubject.value;
    this.stateSubject.next({
      ...state,
      currentInput: '0',
      error: null
    });
  }

  private handleClearAll(): void {
    this.rawTokens = [];
    const state = this.stateSubject.value;
    this.stateSubject.next({
      ...state,
      currentInput: '0',
      expression: '',
      previousValue: null,
      activeOperator: null,
      isResetOnNext: false,
      openParenthesesCount: 0,
      error: null
    });
  }

  /**
   * Helper: Push currentInput value to the raw tokens array
   */
  private pushCurrentInputToTokens(): void {
    const state = this.stateSubject.value;
    
    if (state.isResetOnNext) {
      if (this.rawTokens.length === 0 && state.previousValue !== null) {
        this.rawTokens.push({ type: 'number', value: state.previousValue.toString() });
        this.stateSubject.next({
          ...state,
          isResetOnNext: false
        });
      }
      return;
    }

    if (state.currentInput && state.currentInput !== '-') {
      // If the last token was a close parenthesis, insert implicit multiplication
      // e.g. (2+2)5 -> (2+2) * 5
      if (this.rawTokens.length > 0 && this.rawTokens[this.rawTokens.length - 1].value === ')') {
        this.rawTokens.push({ type: 'operator', value: '*' });
      }
      this.rawTokens.push({ type: 'number', value: state.currentInput });
      
      this.stateSubject.next({
        ...state,
        isResetOnNext: true
      });
    }
  }

  /**
   * Helper: Inserts an implicit multiplication '*' token if preceding structure requires it
   */
  private insertImplicitMultiplicationIfNeeded(): void {
    const state = this.stateSubject.value;
    
    if (state.isResetOnNext) {
      if (this.rawTokens.length === 0 && state.previousValue !== null) {
        this.rawTokens.push({ type: 'number', value: state.previousValue.toString() });
        this.rawTokens.push({ type: 'operator', value: '*' });
        this.stateSubject.next({
          ...state,
          isResetOnNext: false
        });
      }
      return;
    }

    if (state.currentInput && state.currentInput !== '0' && state.currentInput !== '-') {
      this.pushCurrentInputToTokens();
      this.rawTokens.push({ type: 'operator', value: '*' });
    } else if (this.rawTokens.length > 0) {
      const lastToken = this.rawTokens[this.rawTokens.length - 1];
      if (lastToken.type === 'number' || lastToken.value === ')') {
        this.rawTokens.push({ type: 'operator', value: '*' });
      }
    }
  }

  /**
   * Updates state layout, performs sequential calculations, and computes formatted displays
   */
  private updateStateAfterTokenMutation(activeOperator: string | null): void {
    const state = this.stateSubject.value;
    let nextInput = '0';
    let previousValue: number | null = state.previousValue;

    // Check if we can perform sequential pocket calculator folding
    const isSequential = this.isExpressionSequential();
    if (isSequential) {
      try {
        // Find last numeric result before the trailing operator
        const tokensToEval = [...this.rawTokens];
        if (tokensToEval.length > 0 && tokensToEval[tokensToEval.length - 1].type === 'operator') {
          tokensToEval.pop();
        }
        const val = this.evaluateSequential(tokensToEval);
        const precision = this.config.decimalPrecision ?? 8;
        const rounded = this.roundToPrecision(val, precision);
        nextInput = this.formatNumberForDisplay(rounded);
        previousValue = val;
      } catch (err: any) {
        this.stateSubject.next({
          ...state,
          error: err.message || 'Error',
          expression: this.formatTokensForDisplay(this.rawTokens)
        });
        return;
      }
    } else {
      nextInput = state.currentInput;
    }

    this.stateSubject.next({
      ...state,
      currentInput: nextInput,
      previousValue: previousValue,
      activeOperator: activeOperator,
      isResetOnNext: true,
      expression: this.getExpressionDisplay()
    });
  }

  /**
   * Returns true if there are no scientific functions or grouping parentheses in active workspace
   */
  private isExpressionSequential(): boolean {
    return !this.rawTokens.some(t => t.type === 'function' || t.type === 'parenthesis');
  }

  /**
   * Format the token list for display
   */
  private formatTokensForDisplay(tokens: Token[]): string {
    let display = '';
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const next = tokens[i + 1];
      let val = t.value;
      
      if (t.type === 'operator') {
        if (t.value === '*') val = '×';
        if (t.value === '/') val = '÷';
      } else if (t.type === 'function') {
        if (t.value === 'sqrt') val = '√';
      }
      
      display += val;
      
      if (next) {
        if (t.type === 'function' && next.value === '(') {
          continue;
        }
        if (next.value === ')' || t.value === '(' || t.type === 'unary-minus') {
          continue;
        }
        display += ' ';
      }
    }
    return display;
  }

  /**
   * Gets the expression display string, showing sequential values or full equations
   */
  private getExpressionDisplay(): string {
    const isSequential = this.isExpressionSequential();
    if (isSequential) {
      try {
        const tokensToEval = [...this.rawTokens];
        let trailingOp: Token | null = null;
        if (tokensToEval.length > 0 && tokensToEval[tokensToEval.length - 1].type === 'operator') {
          trailingOp = tokensToEval.pop()!;
        }
        const val = this.evaluateSequential(tokensToEval);
        const rounded = this.roundToPrecision(val, this.config.decimalPrecision ?? 8);
        const formattedVal = this.formatNumberForDisplay(rounded);
        if (trailingOp) {
          const displayOp = trailingOp.value === '*' ? '×' : trailingOp.value === '/' ? '÷' : trailingOp.value;
          return `${formattedVal} ${displayOp}`;
        }
        return formattedVal;
      } catch (e) {
        return this.formatTokensForDisplay(this.rawTokens);
      }
    } else {
      return this.formatTokensForDisplay(this.rawTokens);
    }
  }

  /**
   * Evaluates the complete formula stack when equals is triggered
   */
  private evaluateExpression(): void {
    const state = this.stateSubject.value;
    
    // Push the active numerical buffer if not empty/reset
    this.pushCurrentInputToTokens();

    if (this.rawTokens.length === 0) return;

    // Auto-close unmatched open parentheses
    let openCount = 0;
    for (const token of this.rawTokens) {
      if (token.type === 'parenthesis' && token.value === '(') {
        openCount++;
      } else if (token.type === 'parenthesis' && token.value === ')') {
        if (openCount > 0) openCount--;
      }
    }
    
    // Append necessary matching closing parentheses
    const closedTokens = [...this.rawTokens];
    for (let i = 0; i < openCount; i++) {
      closedTokens.push({ type: 'parenthesis', value: ')' });
    }

    try {
      let finalResult = 0;
      const isSequential = !closedTokens.some(t => t.type === 'function' || t.type === 'parenthesis');
      
      if (isSequential) {
        finalResult = this.evaluateSequential(closedTokens);
      } else {
        const processed = this.tagUnaryMinuses(closedTokens);
        finalResult = this.evaluateBODMAS(processed, state.angleMode);
      }

      // Check for overflow / precision formatting
      const precision = this.config.decimalPrecision ?? 8;
      const rounded = this.roundToPrecision(finalResult, precision);
      const displayVal = this.formatNumberForDisplay(rounded);

      // Save successful operation to history
      const originalExpression = this.formatTokensForDisplay(this.rawTokens);
      const historyItem: HistoryItem = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        expression: originalExpression,
        result: displayVal,
        timestamp: Date.now()
      };

      const updatedHistory = this.limitHistory([historyItem, ...state.history], this.config.maxHistoryCount || 20);
      this.saveHistoryToStorage(updatedHistory);

      // Clean workspace variables for subsequent calculations
      this.rawTokens = [];
      this.stateSubject.next({
        ...state,
        currentInput: displayVal,
        expression: '',
        previousValue: finalResult,
        activeOperator: null,
        isResetOnNext: true,
        openParenthesesCount: 0,
        history: updatedHistory,
        error: null
      });

    } catch (err: any) {
      this.stateSubject.next({
        ...state,
        error: err.message || 'Error: Invalid Input',
        expression: this.formatTokensForDisplay(this.rawTokens)
      });
    }
  }

  /**
   * Flat expression calculator engine (Pocket Calculator sequence folding)
   */
  private evaluateSequential(tokens: Token[]): number {
    if (tokens.length === 0) return 0;
    
    let index = 0;
    let accumulator = 0;
    let isNegative = false;

    if (tokens[index] && (tokens[index].type === 'unary-minus' || tokens[index].value === '-')) {
      isNegative = true;
      index++;
    }

    if (index >= tokens.length) return 0;

    if (tokens[index].type === 'number') {
      accumulator = parseFloat(tokens[index].value);
      if (isNegative) accumulator = -accumulator;
      index++;
    } else {
      throw new Error('Error: Invalid Input');
    }

    while (index < tokens.length) {
      const opToken = tokens[index];
      if (opToken.type !== 'operator') {
        throw new Error('Error: Invalid Input');
      }
      index++;

      if (index >= tokens.length) {
        break; // Trailing operator
      }

      const nextValToken = tokens[index];
      if (nextValToken.type !== 'number') {
        throw new Error('Error: Invalid Input');
      }
      const val = parseFloat(nextValToken.value);
      index++;

      if (opToken.value === '+') {
        accumulator += val;
      } else if (opToken.value === '-') {
        accumulator -= val;
      } else if (opToken.value === '*') {
        accumulator *= val;
      } else if (opToken.value === '/') {
        if (val === 0) {
          throw new Error('Error: Cannot divide by zero');
        }
        accumulator /= val;
      }
    }

    return accumulator;
  }

  /**
   * Pre-process tokens list to tag binary vs unary minuses
   */
  private tagUnaryMinuses(tokens: Token[]): Token[] {
    const processed: Token[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.type === 'operator' && token.value === '-') {
        const prev = processed[processed.length - 1];
        const isUnary = !prev || prev.type === 'operator' || (prev.type === 'parenthesis' && prev.value === '(') || prev.type === 'function';
        if (isUnary) {
          processed.push({ type: 'unary-minus', value: '-' });
        } else {
          processed.push(token);
        }
      } else {
        processed.push(token);
      }
    }
    return processed;
  }

  /**
   * BODMAS algebraic parser (Shunting-yard algorithm + RPN solver)
   */
  private evaluateBODMAS(tokens: Token[], angleMode: 'deg' | 'rad'): number {
    const outputQueue: Token[] = [];
    const operatorStack: Token[] = [];
    
    const precedence: Record<string, number> = {
      '+': 2,
      '-': 2,
      '*': 3,
      '/': 3,
      'unary-minus': 4,
      'sin': 5,
      'cos': 5,
      'tan': 5,
      'log': 5,
      'ln': 5,
      'sqrt': 5
    };

    const isLeftAssociative = (op: string) => op !== 'unary-minus' && !['sin', 'cos', 'tan', 'log', 'ln', 'sqrt'].includes(op);

    for (const token of tokens) {
      if (token.type === 'number') {
        outputQueue.push(token);
      } else if (token.type === 'function') {
        operatorStack.push(token);
      } else if (token.type === 'unary-minus') {
        operatorStack.push(token);
      } else if (token.type === 'parenthesis' && token.value === '(') {
        operatorStack.push(token);
      } else if (token.type === 'parenthesis' && token.value === ')') {
        let foundOpen = false;
        while (operatorStack.length > 0) {
          const top = operatorStack[operatorStack.length - 1];
          if (top.type === 'parenthesis' && top.value === '(') {
            operatorStack.pop();
            foundOpen = true;
            break;
          }
          outputQueue.push(operatorStack.pop()!);
        }
        if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type === 'function') {
          outputQueue.push(operatorStack.pop()!);
        }
      } else if (token.type === 'operator') {
        const op1 = token.value;
        while (operatorStack.length > 0) {
          const top = operatorStack[operatorStack.length - 1];
          if (top.type === 'parenthesis' && top.value === '(') {
            break;
          }
          
          const pTop = precedence[top.type === 'function' ? top.value : top.type === 'unary-minus' ? 'unary-minus' : top.value] || 0;
          const pOp1 = precedence[op1] || 0;
          
          if (pTop > pOp1 || (pTop === pOp1 && isLeftAssociative(top.value))) {
            outputQueue.push(operatorStack.pop()!);
          } else {
            break;
          }
        }
        operatorStack.push(token);
      }
    }

    while (operatorStack.length > 0) {
      const top = operatorStack.pop()!;
      if (top.type === 'parenthesis') continue;
      outputQueue.push(top);
    }

    // Solve postfix RPN
    const evaluationStack: number[] = [];
    
    for (const token of outputQueue) {
      if (token.type === 'number') {
        evaluationStack.push(parseFloat(token.value));
      } else if (token.type === 'unary-minus') {
        if (evaluationStack.length < 1) throw new Error('Error: Invalid Input');
        const val = evaluationStack.pop()!;
        evaluationStack.push(-val);
      } else if (token.type === 'function') {
        if (evaluationStack.length < 1) throw new Error('Error: Invalid Input');
        const val = evaluationStack.pop()!;
        let res = 0;
        
        switch (token.value) {
          case 'sin':
            const radSin = angleMode === 'deg' ? (val * Math.PI) / 180 : val;
            res = Math.sin(radSin);
            break;
          case 'cos':
            const radCos = angleMode === 'deg' ? (val * Math.PI) / 180 : val;
            res = Math.cos(radCos);
            break;
          case 'tan':
            if (angleMode === 'deg') {
              const modVal = Math.abs((val - 90) % 180);
              if (modVal < 1e-9 || modVal > 180 - 1e-9) {
                throw new Error('Error: Invalid Input');
              }
              res = Math.tan((val * Math.PI) / 180);
            } else {
              if (Math.abs(Math.cos(val)) < 1e-15) {
                throw new Error('Error: Invalid Input');
              }
              res = Math.tan(val);
            }
            break;
          case 'log':
            if (val <= 0) throw new Error('Error: Invalid Input');
            res = Math.log10(val);
            break;
          case 'ln':
            if (val <= 0) throw new Error('Error: Invalid Input');
            res = Math.log(val);
            break;
          case 'sqrt':
            if (val < 0) throw new Error('Error: Invalid Input');
            res = Math.sqrt(val);
            break;
          default:
            throw new Error('Error: Invalid Input');
        }
        evaluationStack.push(res);
      } else if (token.type === 'operator') {
        if (evaluationStack.length < 2) throw new Error('Error: Invalid Input');
        const b = evaluationStack.pop()!;
        const a = evaluationStack.pop()!;
        let res = 0;

        switch (token.value) {
          case '+':
            res = a + b;
            break;
          case '-':
            res = a - b;
            break;
          case '*':
            res = a * b;
            break;
          case '/':
            if (b === 0) {
              throw new Error('Error: Cannot divide by zero');
            }
            res = a / b;
            break;
          default:
            throw new Error('Error: Invalid Input');
        }
        evaluationStack.push(res);
      }
    }

    if (evaluationStack.length !== 1) {
      throw new Error('Error: Invalid Input');
    }

    return evaluationStack[0];
  }

  /* --- Math Helpers --- */

  private roundToPrecision(value: number, precision: number): number {
    if (isNaN(value) || !isFinite(value)) return value;
    // Handle floating-point arithmetic errors (like 0.1 + 0.2 = 0.30000000000000004)
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  private formatNumberForDisplay(value: number): string {
    if (isNaN(value) || !isFinite(value)) return value.toString();
    
    // Overflow check: values above 999,999,999,999 formatted in scientific notation
    if (Math.abs(value) > 999999999999) {
      return value.toExponential(6);
    }

    return value.toString();
  }

  /* --- Storage persistence --- */

  private loadHistoryFromStorage(): void {
    try {
      const stored = window.localStorage.getItem('11_11_calculator_history');
      if (stored) {
        const history: HistoryItem[] = JSON.parse(stored);
        const currentState = this.stateSubject.value;
        const validHistory = this.limitHistory(history, this.config.maxHistoryCount || 20);
        this.stateSubject.next({
          ...currentState,
          history: validHistory
        });
      }
    } catch (e) {
      // Gracefully ignore local storage reading issues
    }
  }

  private saveHistoryToStorage(history: HistoryItem[]): void {
    try {
      window.localStorage.setItem('11_11_calculator_history', JSON.stringify(history));
    } catch (e) {
      // Gracefully ignore local storage writing issues
    }
  }

  private limitHistory(history: HistoryItem[], limit: number): HistoryItem[] {
    return history.slice(0, limit);
  }
}
