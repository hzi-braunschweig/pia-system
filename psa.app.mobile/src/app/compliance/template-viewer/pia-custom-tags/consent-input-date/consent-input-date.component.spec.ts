import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MockModule } from 'ng-mocks';

import { ConsentInputDateComponent } from './consent-input-date.component';

describe('ConsentInputDateComponent', () => {
  let component: ConsentInputDateComponent;
  let fixture: ComponentFixture<ConsentInputDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsentInputDateComponent],
      imports: [MockModule(TranslateModule), MockModule(ReactiveFormsModule)],
    }).compileComponents();
  });

  it('should create and run ngOnInit with no error', fakeAsync(() => {
    fixture = TestBed.createComponent(ConsentInputDateComponent);
    component = fixture.componentInstance;
    component.form = new FormGroup({});
    component.consentName = 'group';
    component.groupName = 'date';
    fixture.detectChanges();
    tick();
    expect(component).toBeTruthy();
  }));
});
