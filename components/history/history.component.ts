import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoryItem } from '../../models/calculator.interfaces';

@Component({
  selector: 'calculator-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryComponent {
  @Input() history: HistoryItem[] = [];
  @Input() isVisible: boolean = false;

  @Output() selectItem = new EventEmitter<HistoryItem>();
  @Output() clearHistory = new EventEmitter<void>();
  @Output() closePanel = new EventEmitter<void>();

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
