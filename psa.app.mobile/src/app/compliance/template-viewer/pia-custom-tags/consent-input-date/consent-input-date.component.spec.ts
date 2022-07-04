/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MockModule } from 'ng-mocks';
import { By } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';

import { ConsentInputDateComponent } from './consent-input-date.component';
import { Component, ViewChild } from '@angular/core';

describe('ConsentInputDateComponent', () => {
  let component: HostWithInitialDateValueComponent;
  let fixture: ComponentFixture<HostWithInitialDateValueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ConsentInputDateComponent,
        HostComponent,
        HostWithInitialDateValueComponent,
      ],
      imports: [IonicModule.forRoot(), MockModule(TranslateModule)],
    }).compileComponents();
  });

  it('should format the form value to a display value', fakeAsync(() => {
    // Arrange
    fixture = TestBed.createComponent(HostComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
    tick();

    // Act
    component.consentInputDate.formControl.setValue('1965-04-01');
    tick();
    fixture.detectChanges();

    // Assert
    const displayValueElement = fixture.debugElement.query(
      By.css('[data-unit="display-value"]')
    ).nativeElement;

    expect(displayValueElement).not.toBeNull();
    expect(displayValueElement.value).toEqual('01.04.1965');
    flush();
  }));

  it('should display the initially set date', fakeAsync(() => {
    // Arrange
    fixture = TestBed.createComponent(HostWithInitialDateValueComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
    tick();

    // Assert
    const displayValueElement = fixture.debugElement.query(
      By.css('[data-unit="display-value"]')
    ).nativeElement;

    expect(displayValueElement).not.toBeNull();
    expect(displayValueElement.value).toEqual('01.04.1965');
    flush();
  }));

  const template = `<app-consent-input-date
      #component
      [form]="form"
      groupName="group"
      consentName="date"
      label="Date Field"
    ></app-consent-input-date>`;

  @Component({
    selector: 'app-host',
    template,
  })
  class HostComponent {
    @ViewChild('component')
    consentInputDate: ConsentInputDateComponent;
    form: FormGroup = new FormGroup({});
  }

  @Component({
    selector: 'app-with-initial-date-value-host',
    template,
  })
  class HostWithInitialDateValueComponent extends HostComponent {
    form: FormGroup = new FormGroup({
      group: new FormGroup({
        date: new FormControl('1965-04-01'),
      }),
    });
  }
});
