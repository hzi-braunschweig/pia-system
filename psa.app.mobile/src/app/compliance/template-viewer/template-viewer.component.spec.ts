/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateViewerComponent } from './template-viewer.component';

describe('TemplateViewerComponent', () => {
  let component: TemplateViewerComponent;
  let fixture: ComponentFixture<TemplateViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TemplateViewerComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplateViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
