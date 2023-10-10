/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HintComponent } from './hint.component';
import { Component } from '@angular/core';

@Component({
  selector: 'app-test',
  template: '<app-hint>This is the hint</app-hint>',
})
class TestComponent {}

describe('HintComponent', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [HintComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display the hint text', () => {
    expect(fixture.debugElement.nativeElement.innerText).toContain(
      'This is the hint'
    );
  });
});
