/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from 'src/app/app.module';
import { fakeAsync, tick } from '@angular/core/testing';
import { ProbandPersonalInfoComponent } from './proband-personal-info.component';
import { ActivatedRoute } from '@angular/router';

describe('ProbandPersonalInfoComponent', () => {
  let fixture: MockedComponentFixture;
  let component: ProbandPersonalInfoComponent;

  beforeEach(async () => {
    // Provider and Services

    // Build Base Module
    await MockBuilder(ProbandPersonalInfoComponent, AppModule).provide({
      provide: ActivatedRoute,
      useValue: { snapshot: { paramMap: new Map([['username', 'test']]) } },
    });
  });

  beforeEach(fakeAsync(() => {
    // Setup mocks before creating component

    // Create component
    fixture = MockRender(ProbandPersonalInfoComponent);
    component = fixture.point.componentInstance;
    tick(); // wait for ngOnInit to finish
  }));

  it('should create the component', () => {
    expect(component).toBeDefined();
    fixture.detectChanges();
  });
});
