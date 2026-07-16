import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { CalculatorConfig, CalculatorState, HistoryItem } from './models/calculator.interfaces';
import { CalculatorService } from './services/calculator.service';
import { DisplayComponent } from './components/display/display.component';
import { KeyboardComponent } from './components/keyboard/keyboard.component';
import { HistoryComponent } from './components/history/history.component';

@Component({
    selector: 'calculator-app',
    imports: [CommonModule, DisplayComponent, KeyboardComponent, HistoryComponent],
    providers: [CalculatorService],
    templateUrl: './calculator.component.html',
    styleUrls: ['./calculator.component.scss'],
    host: {
      '(window:keydown)': 'handleKeyboardEvent($event)'
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalculatorComponent {
  readonly config = input<CalculatorConfig>({});

  readonly telemetryUpdate = output<{ action: string, value: string }>();

  public state$: Observable<CalculatorState>;
  public isHistoryOpen: boolean = false;

  constructor(private calculatorService: CalculatorService) {
    this.state$ = this.calculatorService.state$;

    effect(() => {
      this.calculatorService.setConfig(this.config());
    });
  }

  /**
   * Capture and route physical keyboard inputs
   */
  public handleKeyboardEvent(event: KeyboardEvent): void {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return;
    }

    const key = event.key;
    let mappedKey: string | null = null;

    if (/^[0-9\.\+\-\*\/]$/.test(key)) {
      mappedKey = key;
    } else if (key === 'Enter' || key === '=') {
      mappedKey = '=';
      event.preventDefault();
    } else if (key === 'Backspace') {
      mappedKey = '⌫';
      event.preventDefault();
    } else if (key === 'Escape') {
      mappedKey = 'C';
      event.preventDefault();
    } else if (key === '(' || key === ')') {
      mappedKey = key;
    } else if (key.toLowerCase() === 's') {
      mappedKey = 'sin';
    } else if (key.toLowerCase() === 'c') {
      mappedKey = 'cos';
    } else if (key.toLowerCase() === 't') {
      mappedKey = 'tan';
    } else if (key.toLowerCase() === 'l') {
      mappedKey = 'log';
    } else if (key.toLowerCase() === 'n') {
      mappedKey = 'ln';
    } else if (key.toLowerCase() === 'r') {
      mappedKey = '√';
    }

    if (mappedKey) {
      this.handleKeyAction(mappedKey);
    }
  }

  /**
   * Relay all input interactions to service and emit telemetry
   */
  public handleKeyAction(key: string): void {
    this.calculatorService.handleKey(key);
    this.telemetryUpdate.emit({ action: 'key_press', value: key });
  }

  public toggleHistory(): void {
    this.isHistoryOpen = !this.isHistoryOpen;
    this.telemetryUpdate.emit({
      action: 'toggle_history',
      value: this.isHistoryOpen ? 'open' : 'closed'
    });
  }

  public onSelectHistoryItem(item: HistoryItem): void {
    this.calculatorService.selectHistoryItem(item);
    this.telemetryUpdate.emit({ action: 'select_history_item', value: item.result });
  }

  public onClearHistory(): void {
    this.calculatorService.clearHistory();
    this.telemetryUpdate.emit({ action: 'clear_history', value: '' });
  }

  public onToggleAngleMode(): void {
    this.calculatorService.toggleAngleMode();
    this.telemetryUpdate.emit({ action: 'toggle_angle_mode', value: '' });
  }
}
