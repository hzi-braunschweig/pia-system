import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsentSwitchRadioComponent } from './consent-switch-radio.component';
import { MockModule } from 'ng-mocks';
import { TemplateModule } from '../../template.module';
import { FormGroup } from '@angular/forms';
import { SegmentType } from '../../../../psa.app.core/models/Segments';

describe('ConsentSwitchRadioComponent', () => {
  let component: ConsentSwitchRadioComponent;
  let fixture: ComponentFixture<ConsentSwitchRadioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockModule(TemplateModule)],
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
