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
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MockModule } from 'ng-mocks';
import { By } from '@angular/platform-browser';

import { Platform } from '@ionic/angular/standalone';

import { ConsentInputDateComponent } from './consent-input-date.component';
import { Component, ViewChild } from '@angular/core';

describe('ConsentInputDateComponent', () => {
  let component: HostWithInitialDateValueComponent;
  let fixture: ComponentFixture<HostWithInitialDateValueComponent>;
  let platformSpy: jasmine.SpyObj<Platform>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('Platform', ['is']);

    await TestBed.configureTestingModule({
      imports: [
        MockModule(TranslateModule),
        MockModule(ReactiveFormsModule),
        ConsentInputDateComponent,
        HostComponent,
        HostWithInitialDateValueComponent,
      ],
      providers: [{ provide: Platform, useValue: spy }],
    }).compileComponents();

    platformSpy = TestBed.inject(Platform) as jasmine.SpyObj<Platform>;
  });

  describe('hybrid platform', () => {
    it('should format the form value to a display value', fakeAsync(() => {
      // Arrange
      platformSpy.is.and.returnValue(true);
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
      platformSpy.is.and.returnValue(true);
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
  });

  describe('non-hybrid platform', () => {
    it('should format the form value to a display value', fakeAsync(() => {
      // Arrange
      platformSpy.is.and.returnValue(false);
      fixture = TestBed.createComponent(HostComponent);
      component = fixture.componentInstance;

      fixture.detectChanges();
      tick();

      // Act
      component.consentInputDate.formControl.setValue(
        '1965-04-01T00:00:00.000Z'
      );
      tick();
      fixture.detectChanges();

      // Assert
      const dateInputElement = fixture.debugElement.query(
        By.css('input[type="date"]')
      ).nativeElement;

      expect(dateInputElement).not.toBeNull();
      expect(dateInputElement.value).toEqual('1965-04-01');
      flush();
    }));

    it('should display the initially set date', fakeAsync(() => {
      // Arrange
      platformSpy.is.and.returnValue(false);
      fixture = TestBed.createComponent(HostWithInitialDateValueComponent);
      component = fixture.componentInstance;

      fixture.detectChanges();
      tick();

      // Assert
      const dateInputElement = fixture.debugElement.query(
        By.css('input[type="date"]')
      ).nativeElement;

      expect(dateInputElement).not.toBeNull();
      expect(dateInputElement.value).toEqual('1965-04-01');
      flush();
    }));
  });

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
    imports: [ConsentInputDateComponent],
  })
  class HostComponent {
    @ViewChild('component')
    consentInputDate: ConsentInputDateComponent;
    form: FormGroup = new FormGroup({});
  }

  @Component({
    selector: 'app-with-initial-date-value-host',
    template,
    imports: [ConsentInputDateComponent],
  })
  class HostWithInitialDateValueComponent extends HostComponent {
    form: FormGroup = new FormGroup({
      group: new FormGroup({
        date: new FormControl('1965-04-01'),
      }),
    });
  }
});
