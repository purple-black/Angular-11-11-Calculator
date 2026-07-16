import { Token } from '../models/calculator.interfaces';

/**
 * Pure expression evaluation and display formatting.
 * Owns sequential (pocket) math, BODMAS/RPN, and number formatting.
 */
export class ExpressionEvaluator {
  public isExpressionSequential(tokens: Token[]): boolean {
    return !tokens.some(t => t.type === 'function' || t.type === 'parenthesis');
  }

  public formatTokensForDisplay(tokens: Token[]): string {
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

  public getExpressionDisplay(tokens: Token[], decimalPrecision: number): string {
    if (this.isExpressionSequential(tokens)) {
      try {
        const tokensToEval = [...tokens];
        let trailingOp: Token | null = null;
        if (tokensToEval.length > 0 && tokensToEval[tokensToEval.length - 1].type === 'operator') {
          trailingOp = tokensToEval.pop()!;
        }
        const val = this.evaluateSequential(tokensToEval);
        const rounded = this.roundToPrecision(val, decimalPrecision);
        const formattedVal = this.formatNumberForDisplay(rounded);
        if (trailingOp) {
          const displayOp = trailingOp.value === '*' ? '×' : trailingOp.value === '/' ? '÷' : trailingOp.value;
          return `${formattedVal} ${displayOp}`;
        }
        return formattedVal;
      } catch {
        return this.formatTokensForDisplay(tokens);
      }
    }
    return this.formatTokensForDisplay(tokens);
  }

  public closeUnmatchedParentheses(tokens: Token[]): Token[] {
    let openCount = 0;
    for (const token of tokens) {
      if (token.type === 'parenthesis' && token.value === '(') {
        openCount++;
      } else if (token.type === 'parenthesis' && token.value === ')') {
        if (openCount > 0) openCount--;
      }
    }

    const closedTokens = [...tokens];
    for (let i = 0; i < openCount; i++) {
      closedTokens.push({ type: 'parenthesis', value: ')' });
    }
    return closedTokens;
  }

  public evaluate(tokens: Token[], angleMode: 'deg' | 'rad'): number {
    if (this.isExpressionSequential(tokens)) {
      return this.evaluateSequential(tokens);
    }
    const processed = this.tagUnaryMinuses(tokens);
    return this.evaluateBODMAS(processed, angleMode);
  }

  public evaluateSequential(tokens: Token[]): number {
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

  public tagUnaryMinuses(tokens: Token[]): Token[] {
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

  public evaluateBODMAS(tokens: Token[], angleMode: 'deg' | 'rad'): number {
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
        while (operatorStack.length > 0) {
          const top = operatorStack[operatorStack.length - 1];
          if (top.type === 'parenthesis' && top.value === '(') {
            operatorStack.pop();
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

  public roundToPrecision(value: number, precision: number): number {
    if (isNaN(value) || !isFinite(value)) return value;
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  public formatNumberForDisplay(value: number): string {
    if (isNaN(value) || !isFinite(value)) return value.toString();

    if (Math.abs(value) > 999999999999) {
      return value.toExponential(6);
    }

    return value.toString();
  }
}
