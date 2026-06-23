import { CalculatorConfig } from '../models/calculator.interfaces';
import { DEFAULT_CONFIG } from '../calculator.constants';

export function validateConfig(config: Partial<CalculatorConfig> | null | undefined): CalculatorConfig {
  const merged: CalculatorConfig = { ...DEFAULT_CONFIG, ...config };

  // Validate enableHistory
  if (typeof merged.enableHistory !== 'boolean') {
    merged.enableHistory = DEFAULT_CONFIG.enableHistory;
  }

  // Validate maxHistoryCount: integer between 1 and 100
  if (
    typeof merged.maxHistoryCount !== 'number' ||
    !Number.isInteger(merged.maxHistoryCount) ||
    merged.maxHistoryCount < 1 ||
    merged.maxHistoryCount > 100
  ) {
    merged.maxHistoryCount = DEFAULT_CONFIG.maxHistoryCount;
  }

  // Validate allowDecimals
  if (typeof merged.allowDecimals !== 'boolean') {
    merged.allowDecimals = DEFAULT_CONFIG.allowDecimals;
  }

  // Validate decimalPrecision: integer between 0 and 15
  if (
    typeof merged.decimalPrecision !== 'number' ||
    !Number.isInteger(merged.decimalPrecision) ||
    merged.decimalPrecision < 0 ||
    merged.decimalPrecision > 15
  ) {
    merged.decimalPrecision = DEFAULT_CONFIG.decimalPrecision;
  }

  // Validate enableScientific
  if (typeof merged.enableScientific !== 'boolean') {
    merged.enableScientific = DEFAULT_CONFIG.enableScientific;
  }

  // Validate defaultAngleMode: 'deg' or 'rad'
  if (merged.defaultAngleMode !== 'deg' && merged.defaultAngleMode !== 'rad') {
    merged.defaultAngleMode = DEFAULT_CONFIG.defaultAngleMode;
  }

  return merged;
}
