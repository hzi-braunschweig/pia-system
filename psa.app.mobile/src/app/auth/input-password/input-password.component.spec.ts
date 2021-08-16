/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { InputPasswordComponent } from './input-password.component';
import { By } from '@angular/platform-browser';

describe('InputPasswordComponent', () => {
  let component: InputPasswordComponent;
  let fixture: ComponentFixture<InputPasswordComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InputPasswordComponent],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(InputPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render a password input field', () => {
    const input = fixture.debugElement.query(
      By.css('[data-unit="unit-input-password"]')
    );
    expect(input).toBeDefined();
    expect(input.nativeElement.type).toEqual('password');
  });

  it('should render a normal input field when reveal password button is pressed', () => {
    const input = fixture.debugElement.query(
      By.css('[data-unit="unit-input-password"]')
    );

    const button = fixture.debugElement.query(
      By.css('[data-unit="unit-reveal-password-button"]')
    );
    expect(input.nativeElement.type).toEqual('password');

    button.nativeElement.dispatchEvent(new MouseEvent('pointerdown'));
    fixture.detectChanges();
    expect(input.nativeElement.type).toEqual('text');
  });

  it('should not show the reveal password button if input is disabled', () => {
    component.disabled = true;
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(
        By.css('[data-unit="unit-reveal-password-button"]')
      )
    ).toBeNull();
  });
});
