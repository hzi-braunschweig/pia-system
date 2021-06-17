import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';

import { ConsentSwitchRadioComponent } from './consent-switch-radio.component';
import { SegmentType } from '../../../segment.model';

describe('ConsentSwitchRadioComponent', () => {
  let component: ConsentSwitchRadioComponent;
  let fixture: ComponentFixture<ConsentSwitchRadioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsentSwitchRadioComponent);
    component = fixture.componentInstance;
    component.form = new FormGroup({});
    component.groupName = 'testGroup';
    component.segment = {
      type: SegmentType.CUSTOM_TAG,
      tagName: 'pia-consent-switch-radio-generic',
      attrs: [{ name: 'name', value: 'myGenericConsent' }],
      children: [],
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
