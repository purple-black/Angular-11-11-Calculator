import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CalculatorComponent } from './calculator.component';
import { DisplayComponent } from './components/display/display.component';
import { KeyboardComponent } from './components/keyboard/keyboard.component';
import { HistoryComponent } from './components/history/history.component';

describe('CalculatorComponent', () => {
  let component: CalculatorComponent;
  let fixture: ComponentFixture<CalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CalculatorComponent,
        DisplayComponent,
        KeyboardComponent,
        HistoryComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CalculatorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', {
      enableHistory: true,
      enableScientific: true,
      allowDecimals: true
    });
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render title inside header', () => {
    const titleEl = fixture.debugElement.query(By.css('h1'));
    expect(titleEl.nativeElement.textContent).toContain('11:11 Calculator');
  });

  it('should toggle history visibility and emit telemetry', () => {
    spyOn(component.telemetryUpdate, 'emit');
    
    expect(component.isHistoryOpen).toBeFalse();
    
    // Toggle on
    component.toggleHistory();
    expect(component.isHistoryOpen).toBeTrue();
    expect(component.telemetryUpdate.emit).toHaveBeenCalledWith({
      action: 'toggle_history',
      value: 'open'
    });

    // Toggle off
    component.toggleHistory();
    expect(component.isHistoryOpen).toBeFalse();
    expect(component.telemetryUpdate.emit).toHaveBeenCalledWith({
      action: 'toggle_history',
      value: 'closed'
    });
  });

  it('should emit telemetry on key click action', () => {
    spyOn(component.telemetryUpdate, 'emit');
    component.handleKeyAction('5');
    expect(component.telemetryUpdate.emit).toHaveBeenCalledWith({
      action: 'key_press',
      value: '5'
    });
  });

  it('should delegate key clicked events from keypad grid', () => {
    spyOn(component, 'handleKeyAction');
    const keyboardEl = fixture.debugElement.query(By.directive(KeyboardComponent));
    
    // Trigger action from child component
    keyboardEl.componentInstance.keyAction.emit('+');
    expect(component.handleKeyAction).toHaveBeenCalledWith('+');
  });

  it('should display history drawer when isHistoryOpen is true', () => {
    component.isHistoryOpen = true;
    fixture.detectChanges();
    const historyDrawer = fixture.debugElement.query(By.directive(HistoryComponent));
    expect(historyDrawer).toBeTruthy();
    expect(historyDrawer.componentInstance.isVisible()).toBeTrue();
  });
});
