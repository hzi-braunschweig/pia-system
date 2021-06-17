import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';

import { ConsentInputDateComponent } from './consent-input-date.component';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MockModule } from 'ng-mocks';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';

describe('ConsentInputDateComponent', () => {
  let component: ConsentInputDateComponent;
  let fixture: ComponentFixture<ConsentInputDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsentInputDateComponent],
      imports: [
        MockModule(TranslateModule),
        MockModule(MatFormFieldModule),
        MockModule(MatDatepickerModule),
        MockModule(ReactiveFormsModule),
      ],
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
