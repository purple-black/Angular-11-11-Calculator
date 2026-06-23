import { ChangeDetectionStrategy, Component, Input } from '@angular/core';


@Component({
  selector: 'calculator-display',
  standalone: true,
  imports: [],
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisplayComponent {
  @Input() expression: string = '';
  @Input() value: string = '0';
  @Input() error: string | null = null;
}
