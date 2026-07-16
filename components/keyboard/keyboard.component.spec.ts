import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { KeyboardComponent } from './keyboard.component';

describe('KeyboardComponent', () => {
  let component: KeyboardComponent;
  let fixture: ComponentFixture<KeyboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeyboardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(KeyboardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('showScientific', true);
    fixture.componentRef.setInput('disableDecimals', false);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should emit keyAction when a digit button is clicked', () => {
    spyOn(component.keyAction, 'emit');

    const sevenBtn = fixture.debugElement.query(By.css('[aria-label="seven"]'));
    sevenBtn.triggerEventHandler('click');

    expect(component.keyAction.emit).toHaveBeenCalledWith('7');
  });

  it('should emit scientific key actions from the scientific panel', () => {
    spyOn(component.keyAction, 'emit');

    const sineBtn = fixture.debugElement.query(By.css('[aria-label="sine"]'));
    sineBtn.triggerEventHandler('click');

    expect(component.keyAction.emit).toHaveBeenCalledWith('sin');
  });

  it('should hide the scientific panel when showScientific is false', () => {
    fixture.componentRef.setInput('showScientific', false);
    fixture.detectChanges();

    const scientificGrid = fixture.debugElement.query(By.css('.scientific-grid'));
    expect(scientificGrid).toBeNull();
  });

  it('should disable the decimal button when disableDecimals is true', () => {
    fixture.componentRef.setInput('disableDecimals', true);
    fixture.detectChanges();

    const decimalBtn = fixture.debugElement.query(By.css('[aria-label="decimal point"]'));
    expect(decimalBtn.nativeElement.disabled).toBeTrue();
    expect(decimalBtn.nativeElement.classList.contains('opacity-40')).toBeTrue();
  });

  it('should emit equals from onKeyClick', () => {
    spyOn(component.keyAction, 'emit');
    component.onKeyClick('=');
    expect(component.keyAction.emit).toHaveBeenCalledWith('=');
  });
});
