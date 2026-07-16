import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';


@Component({
    selector: 'calculator-keyboard',
    imports: [],
    templateUrl: './keyboard.component.html',
    styleUrls: ['./keyboard.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class KeyboardComponent {
  readonly disableDecimals = input<boolean>(false);
  readonly showScientific = input<boolean>(true);

  readonly keyAction = output<string>();

  public onKeyClick(key: string): void {
    this.keyAction.emit(key);
  }
}
