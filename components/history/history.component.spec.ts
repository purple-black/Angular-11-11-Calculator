import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HistoryComponent } from './history.component';
import { HistoryItem } from '../../models/calculator.interfaces';

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;

  const sampleHistory: HistoryItem[] = [
    {
      id: '1',
      expression: '2 + 2',
      result: '4',
      timestamp: 1
    },
    {
      id: '2',
      expression: '10 ÷ 2',
      result: '5',
      timestamp: 2
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('history', []);
    fixture.componentRef.setInput('isVisible', true);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty state when history is empty', () => {
    const emptyState = fixture.debugElement.query(By.css('.empty-state'));
    expect(emptyState).toBeTruthy();
    expect(emptyState.nativeElement.textContent).toContain('No calculation history yet.');
  });

  it('should render history rows and emit selectItem on click', () => {
    spyOn(component.selectItem, 'emit');
    fixture.componentRef.setInput('history', sampleHistory);
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('.history-item'));
    expect(rows.length).toBe(2);
    expect(rows[0].nativeElement.textContent).toContain('2 + 2');
    expect(rows[0].nativeElement.textContent).toContain('= 4');

    rows[0].triggerEventHandler('click');
    expect(component.selectItem.emit).toHaveBeenCalledWith(sampleHistory[0]);
  });

  it('should emit clearHistory when clear button is clicked', () => {
    spyOn(component.clearHistory, 'emit');
    fixture.componentRef.setInput('history', sampleHistory);
    fixture.detectChanges();

    const clearBtn = fixture.debugElement.query(By.css('[aria-label="clear history"]'));
    clearBtn.triggerEventHandler('click');

    expect(component.clearHistory.emit).toHaveBeenCalled();
  });

  it('should hide clear button when history is empty', () => {
    const clearBtn = fixture.debugElement.query(By.css('[aria-label="clear history"]'));
    expect(clearBtn).toBeNull();
  });

  it('should emit closePanel when close button is clicked', () => {
    spyOn(component.closePanel, 'emit');

    const closeBtn = fixture.debugElement.query(By.css('[aria-label="close history panel"]'));
    closeBtn.triggerEventHandler('click');

    expect(component.closePanel.emit).toHaveBeenCalled();
  });

  it('should toggle visibility classes from isVisible', () => {
    const panel = fixture.debugElement.query(By.css('.history-panel'));
    expect(panel.nativeElement.classList.contains('translate-x-0')).toBeTrue();

    fixture.componentRef.setInput('isVisible', false);
    fixture.detectChanges();

    expect(panel.nativeElement.classList.contains('translate-x-full')).toBeTrue();
  });
});
