import { bootstrapApplication } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { CalculatorComponent } from '../calculator.component';
import { CalculatorConfig } from '../models/calculator.interfaces';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CalculatorComponent],
  template: `
    <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #0b0f19; padding: 20px;">
      <calculator-app [config]="defaultConfig"></calculator-app>
    </div>
  `
})
export class AppComponent {
  defaultConfig: CalculatorConfig = {
    enableScientific: true,
    enableHistory: true,
    allowDecimals: true,
    maxHistoryCount: 20,
    decimalPrecision: 8,
    defaultAngleMode: 'deg'
  };
}

bootstrapApplication(AppComponent)
  .catch(err => console.error(err));
