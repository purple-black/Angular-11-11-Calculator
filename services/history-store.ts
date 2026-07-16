import { HistoryItem } from '../models/calculator.interfaces';

/**
 * Persists and bounds calculator history in localStorage.
 */
export class HistoryStore {
  private readonly storageKey = '11_11_calculator_history';

  public load(maxCount: number): HistoryItem[] {
    try {
      const stored = window.localStorage.getItem(this.storageKey);
      if (!stored) {
        return [];
      }
      const history: HistoryItem[] = JSON.parse(stored);
      return this.limit(history, maxCount);
    } catch {
      return [];
    }
  }

  public save(history: HistoryItem[]): void {
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(history));
    } catch {
      // Gracefully ignore local storage writing issues
    }
  }

  public limit(history: HistoryItem[], maxCount: number): HistoryItem[] {
    return history.slice(0, maxCount);
  }

  public createItem(expression: string, result: string): HistoryItem {
    return {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      expression,
      result,
      timestamp: Date.now()
    };
  }

  public prepend(item: HistoryItem, history: HistoryItem[], maxCount: number): HistoryItem[] {
    const updated = this.limit([item, ...history], maxCount);
    this.save(updated);
    return updated;
  }

  public clear(): HistoryItem[] {
    this.save([]);
    return [];
  }
}
