import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { HistoryItem } from '../../models/calculator.interfaces';

@Component({
    selector: 'calculator-history',
    imports: [],
    templateUrl: './history.component.html',
    styleUrls: ['./history.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryComponent {
  readonly history = input<HistoryItem[]>([]);
  readonly isVisible = input<boolean>(false);

  readonly selectItem = output<HistoryItem>();
  readonly clearHistory = output<void>();
  readonly closePanel = output<void>();

  public onSelect(item: HistoryItem): void {
    this.selectItem.emit(item);
  }

  public onClear(): void {
    this.clearHistory.emit();
  }

  public onClose(): void {
    this.closePanel.emit();
  }
}
