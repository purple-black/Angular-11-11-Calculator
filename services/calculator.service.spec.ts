// Mock browser global environment for Node.js testing execution
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string): string | null => mockStorage[key] || null,
  setItem: (key: string, value: string): void => { mockStorage[key] = value; },
  clear: (): void => {
    for (const key in mockStorage) {
      delete mockStorage[key];
    }
  }
};

(global as any).window = {
  localStorage: mockLocalStorage
};

import { CalculatorService } from './calculator.service';
import { CalculatorState } from '../models/calculator.interfaces';

describe('CalculatorService', () => {
  let service: CalculatorService;
  let state: CalculatorState;

  beforeEach(() => {
    // Clear storage before each run
    window.localStorage.clear();
    
    service = new CalculatorService();
    
    // Subscribe to capture latest state
    service.state$.subscribe(s => {
      state = s;
    });
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Basic Input and Digits', () => {
    it('should handle digits and decimals correctly', () => {
      service.handleKey('1');
      service.handleKey('2');
      service.handleKey('.');
      service.handleKey('3');
      expect(state.currentInput).toBe('12.3');
      expect(state.error).toBeNull();
    });

    it('should respect 12-digit input constraints', () => {
      const inputs = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '1', '2', '3', '4'];
      for (const key of inputs) {
        service.handleKey(key);
      }
      expect(state.currentInput).toBe('123456789012'); // 13 and 14 should be ignored
    });

    it('should prevent multiple decimal points', () => {
      service.handleKey('1');
      service.handleKey('.');
      service.handleKey('2');
      service.handleKey('.');
      expect(state.currentInput).toBe('1.2');
    });
  });

  describe('Sequential Mode (Pocket Calculator Mode)', () => {
    it('should evaluate sequentially for flat expressions', () => {
      service.handleKey('5');
      service.handleKey('+');
      service.handleKey('3');
      // At this stage, currentInput is '3', expression is '5 +'
      expect(state.currentInput).toBe('3');
      expect(state.expression).toBe('5 +');

      // Tapping operator * should collapse (5 + 3) to 8, expression becomes '8 ×'
      service.handleKey('*');
      expect(state.currentInput).toBe('8');
      expect(state.expression).toBe('8 ×');

      service.handleKey('2');
      service.handleKey('=');
      expect(state.currentInput).toBe('16');
      expect(state.expression).toBe('');
    });
  });

  describe('BODMAS Precedence (Algebraic Mode)', () => {
    it('should bypass sequential evaluation when parentheses are introduced', () => {
      // 5 + 3 * ( 2 + 2 ) should evaluate to 17 using BODMAS, not 32
      service.handleKey('5');
      service.handleKey('+');
      service.handleKey('3');
      service.handleKey('*');
      // Sequential evaluation collapsed this to '8 ×'
      expect(state.currentInput).toBe('8');

      // Now insert parenthesis
      service.handleKey('(');
      // Sequential evaluation is now bypassed, expression shows unsimplified '5 + 3 × ('
      expect(state.expression).toBe('5 + 3 × (');

      service.handleKey('2');
      service.handleKey('+');
      service.handleKey('2');
      service.handleKey(')');
      expect(state.expression).toBe('5 + 3 × (2 + 2)');

      service.handleKey('=');
      expect(state.currentInput).toBe('17');
    });

    it('should auto-close unmatched open parentheses on equals key', () => {
      // 5 * ( 2 + 3 -> auto-closes to 5 * ( 2 + 3 ) = 25
      service.handleKey('5');
      service.handleKey('*');
      service.handleKey('(');
      service.handleKey('2');
      service.handleKey('+');
      service.handleKey('3');
      
      service.handleKey('=');
      expect(state.currentInput).toBe('25');
    });

    it('should handle implicit multiplication before parentheses', () => {
      // 5(2+3) -> 5 * (2+3) = 25
      service.handleKey('5');
      service.handleKey('(');
      service.handleKey('2');
      service.handleKey('+');
      service.handleKey('3');
      service.handleKey(')');
      service.handleKey('=');
      expect(state.currentInput).toBe('25');
    });
  });

  describe('Scientific Operations and Domain Safety', () => {
    it('should compute standard trigonometric functions', () => {
      // Degrees Mode (default): sin(30) = 0.5
      service.handleKey('sin');
      service.handleKey('3');
      service.handleKey('0');
      service.handleKey(')');
      service.handleKey('=');
      expect(parseFloat(state.currentInput)).toBeCloseTo(0.5, 4);

      // cos(60) = 0.5
      service.handleKey('C');
      service.handleKey('cos');
      service.handleKey('6');
      service.handleKey('0');
      service.handleKey(')');
      service.handleKey('=');
      expect(parseFloat(state.currentInput)).toBeCloseTo(0.5, 4);
    });

    it('should compute tan(45) and throw for undefined tan(90) coordinates', () => {
      service.handleKey('tan');
      service.handleKey('4');
      service.handleKey('5');
      service.handleKey(')');
      service.handleKey('=');
      expect(parseFloat(state.currentInput)).toBeCloseTo(1, 4);

      service.handleKey('C');
      service.handleKey('tan');
      service.handleKey('9');
      service.handleKey('0');
      service.handleKey(')');
      service.handleKey('=');
      expect(state.error).toBe('Error: Invalid Input');
    });

    it('should compute log and ln and enforce positive domain boundaries', () => {
      // log(100) = 2
      service.handleKey('log');
      service.handleKey('1');
      service.handleKey('0');
      service.handleKey('0');
      service.handleKey(')');
      service.handleKey('=');
      expect(state.currentInput).toBe('2');

      // log(-10) -> error
      service.handleKey('C');
      service.handleKey('log');
      service.handleKey('-');
      service.handleKey('1');
      service.handleKey('0');
      service.handleKey(')');
      service.handleKey('=');
      expect(state.error).toBe('Error: Invalid Input');
    });

    it('should compute square roots and throw on negative operands', () => {
      // sqrt(16) = 4
      service.handleKey('√');
      service.handleKey('1');
      service.handleKey('6');
      service.handleKey(')');
      service.handleKey('=');
      expect(state.currentInput).toBe('4');

      // sqrt(-4) -> error
      service.handleKey('C');
      service.handleKey('√');
      service.handleKey('-');
      service.handleKey('4');
      service.handleKey(')');
      service.handleKey('=');
      expect(state.error).toBe('Error: Invalid Input');
    });

    it('should throw for division by zero', () => {
      service.handleKey('5');
      service.handleKey('/');
      service.handleKey('0');
      service.handleKey('=');
      expect(state.error).toBe('Error: Cannot divide by zero');
    });
  });

  describe('Configuration and History Persistence', () => {
    it('should respect enableHistory flag and maximum history bounds', () => {
      service.setConfig({ enableHistory: true, maxHistoryCount: 2 });
      
      // Operation 1
      service.handleKey('1');
      service.handleKey('+');
      service.handleKey('1');
      service.handleKey('='); // 2
      
      // Operation 2
      service.handleKey('2');
      service.handleKey('+');
      service.handleKey('2');
      service.handleKey('='); // 4

      // Operation 3
      service.handleKey('3');
      service.handleKey('+');
      service.handleKey('3');
      service.handleKey('='); // 6

      expect(state.history.length).toBe(2);
      expect(state.history[0].result).toBe('6');
      expect(state.history[1].result).toBe('4');
    });

    it('should allow disabling decimals', () => {
      service.setConfig({ allowDecimals: false });
      service.handleKey('5');
      service.handleKey('.');
      service.handleKey('5');
      // Decimal '.' key is ignored, so input is just 55
      expect(state.currentInput).toBe('55');
    });
  });
});
