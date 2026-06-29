import { CalculatorConfig } from './models/calculator.interfaces';

export const DEFAULT_CONFIG: CalculatorConfig = {
  enableHistory: true,
  maxHistoryCount: 20,
  allowDecimals: true,
  decimalPrecision: 8,
  enableScientific: true,
  defaultAngleMode: 'deg'
};
