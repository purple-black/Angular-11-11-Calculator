import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DisplayComponent } from './display.component';

describe('DisplayComponent', () => {
  let component: DisplayComponent;
  let fixture: ComponentFixture<DisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render expression and value', () => {
    fixture.componentRef.setInput('expression', '12 + 5');
    fixture.componentRef.setInput('value', '17');
    fixture.componentRef.setInput('error', null);
    fixture.detectChanges();

    const expressionEl = fixture.debugElement.query(By.css('.expression-line'));
    const valueEl = fixture.debugElement.query(By.css('.value-line'));

    expect(expressionEl.nativeElement.textContent.trim()).toBe('12 + 5');
    expect(valueEl.nativeElement.textContent.trim()).toBe('17');
  });

  it('should show error text and apply error styling when error is set', () => {
    fixture.componentRef.setInput('expression', '5 ÷ 0');
    fixture.componentRef.setInput('value', '0');
    fixture.componentRef.setInput('error', 'Error: Cannot divide by zero');
    fixture.detectChanges();

    const valueEl = fixture.debugElement.query(By.css('.value-line'));

    expect(valueEl.nativeElement.textContent.trim()).toBe('Error: Cannot divide by zero');
    expect(valueEl.nativeElement.classList.contains('error-text')).toBeTrue();
  });

  it('should expose a polite live region for screen readers', () => {
    const valueEl = fixture.debugElement.query(By.css('.value-line'));

    expect(valueEl.attributes['role']).toBe('status');
    expect(valueEl.attributes['aria-live']).toBe('polite');
    expect(valueEl.attributes['aria-atomic']).toBe('true');
  });
});
