import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';


@Component({
    selector: 'calculator-keyboard',
    imports: [],
    templateUrl: './keyboard.component.html',
    styleUrls: ['./keyboard.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class KeyboardComponent {
  @Input() disableDecimals: boolean = false;
  @Input() showScientific: boolean = true;

  @Output() keyAction = new EventEmitter<string>();

  public onKeyClick(key: string): void {
    this.keyAction.emit(key);
  }
}
