import { ChangeDetectionStrategy, Component, input } from '@angular/core';


@Component({
    selector: 'calculator-display',
    imports: [],
    templateUrl: './display.component.html',
    styleUrls: ['./display.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisplayComponent {
  readonly expression = input<string>('');
  readonly value = input<string>('0');
  readonly error = input<string | null>(null);
}
