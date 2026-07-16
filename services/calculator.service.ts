import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CalculatorConfig, CalculatorState, HistoryItem, Token } from '../models/calculator.interfaces';
import { DEFAULT_CONFIG } from '../calculator.constants';
import { validateConfig } from '../validators/config.validator';
import { ExpressionEvaluator } from './expression-evaluator';
import { HistoryStore } from './history-store';

/**
 * Thin façade: owns UI state and key routing.
 * Delegates math to ExpressionEvaluator and persistence to HistoryStore.
 */
@Injectable()
export class CalculatorService {
  private config: CalculatorConfig = DEFAULT_CONFIG;
  private rawTokens: Token[] = [];

  private readonly evaluator = new ExpressionEvaluator();
  private readonly historyStore = new HistoryStore();

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
    const history = this.historyStore.load(this.config.maxHistoryCount || 20);
    if (history.length > 0) {
      this.stateSubject.next({
        ...this.stateSubject.value,
        history
      });
    }
  }

  public setConfig(config: Partial<CalculatorConfig> | null | undefined): void {
    this.config = validateConfig(config);
    const currentState = this.stateSubject.value;

    const updatedHistory = this.historyStore.limit(
      currentState.history,
      this.config.maxHistoryCount || 20
    );
    this.stateSubject.next({
      ...currentState,
      angleMode: this.config.defaultAngleMode || 'deg',
      history: updatedHistory
    });
  }

  public handleKey(key: string): void {
    const state = this.stateSubject.value;

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
        break;
    }
  }

  public toggleAngleMode(): void {
    const currentState = this.stateSubject.value;
    const nextMode = currentState.angleMode === 'deg' ? 'rad' : 'deg';
    this.stateSubject.next({
      ...currentState,
      angleMode: nextMode
    });
  }

  public clearHistory(): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      history: this.historyStore.clear()
    });
  }

  public selectHistoryItem(item: HistoryItem): void {
    const state = this.stateSubject.value;
    if (state.error) return;

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

  private handleDigit(digit: string): void {
    const state = this.stateSubject.value;
    let nextInput = state.currentInput;

    if (state.isResetOnNext || nextInput === '0') {
      nextInput = digit;
    } else {
      const digitCount = nextInput.replace(/[^0-9]/g, '').length;
      if (digitCount >= 12) {
        return;
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

    this.pushCurrentInputToTokens();

    if (this.rawTokens.length === 0) {
      if (operator === '-') {
        this.stateSubject.next({
          ...state,
          currentInput: '-',
          isResetOnNext: false
        });
        return;
      }
      this.rawTokens.push({ type: 'number', value: '0' });
    }

    const lastToken = this.rawTokens[this.rawTokens.length - 1];

    if (lastToken.type === 'operator') {
      this.rawTokens[this.rawTokens.length - 1] = { type: 'operator', value: operator };
    } else {
      this.rawTokens.push({ type: 'operator', value: operator });
    }

    this.updateStateAfterTokenMutation(operator);
  }

  private handleOpenParenthesis(): void {
    const state = this.stateSubject.value;

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

  private updateStateAfterTokenMutation(activeOperator: string | null): void {
    const state = this.stateSubject.value;
    let nextInput = '0';
    let previousValue: number | null = state.previousValue;
    const precision = this.config.decimalPrecision ?? 8;

    if (this.evaluator.isExpressionSequential(this.rawTokens)) {
      try {
        const tokensToEval = [...this.rawTokens];
        if (tokensToEval.length > 0 && tokensToEval[tokensToEval.length - 1].type === 'operator') {
          tokensToEval.pop();
        }
        const val = this.evaluator.evaluateSequential(tokensToEval);
        const rounded = this.evaluator.roundToPrecision(val, precision);
        nextInput = this.evaluator.formatNumberForDisplay(rounded);
        previousValue = val;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error';
        this.stateSubject.next({
          ...state,
          error: message,
          expression: this.evaluator.formatTokensForDisplay(this.rawTokens)
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

  private getExpressionDisplay(): string {
    return this.evaluator.getExpressionDisplay(
      this.rawTokens,
      this.config.decimalPrecision ?? 8
    );
  }

  private evaluateExpression(): void {
    const state = this.stateSubject.value;

    this.pushCurrentInputToTokens();

    if (this.rawTokens.length === 0) return;

    const closedTokens = this.evaluator.closeUnmatchedParentheses(this.rawTokens);

    try {
      const finalResult = this.evaluator.evaluate(closedTokens, state.angleMode);
      const precision = this.config.decimalPrecision ?? 8;
      const rounded = this.evaluator.roundToPrecision(finalResult, precision);
      const displayVal = this.evaluator.formatNumberForDisplay(rounded);

      const originalExpression = this.evaluator.formatTokensForDisplay(this.rawTokens);
      const historyItem = this.historyStore.createItem(originalExpression, displayVal);
      const updatedHistory = this.historyStore.prepend(
        historyItem,
        state.history,
        this.config.maxHistoryCount || 20
      );

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error: Invalid Input';
      this.stateSubject.next({
        ...state,
        error: message,
        expression: this.evaluator.formatTokensForDisplay(this.rawTokens)
      });
    }
  }
}
