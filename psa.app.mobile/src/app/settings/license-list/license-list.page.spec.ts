/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonSkeletonText,
} from '@ionic/angular';

import { LicenseJson, LicenseListPage } from './license-list.page';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { MockComponent, MockPipe } from 'ng-mocks';
import { TranslatePipe } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ScrollingModule } from '@angular/cdk/scrolling';

describe('LicenseListPage', () => {
  let component: LicenseListPage;
  let fixture: ComponentFixture<LicenseListPage>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        LicenseListPage,
        MockPipe(TranslatePipe),
        MockComponent(HeaderComponent),
        IonContent,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardSubtitle,
        IonCardContent,
        IonSkeletonText,
      ],
      imports: [HttpClientTestingModule, ScrollingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LicenseListPage);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should fetch licenses', () => {
    const licensesSpy = jasmine.createSpy();
    component.licenses.subscribe(licensesSpy);
    const response = createLicensesJson();

    const mockRequest = httpMock.expectOne('../../../assets/licenses.json');
    mockRequest.flush(response);

    expect(licensesSpy).toHaveBeenCalledWith(response.licenses);
  });

  it('should show loading indicator while licenses are fetched', () => {
    expect(
      fixture.debugElement.query(By.css('[data-unit="unit-loading-indicator"]'))
    ).not.toBeNull();

    const mockRequest = httpMock.expectOne('../../../assets/licenses.json');
    mockRequest.flush(createLicensesJson());
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('[data-unit="unit-loading-indicator"]'))
    ).toBeNull();
  });

  it('should show cards with licenses', fakeAsync(() => {
    const mockRequest = httpMock.expectOne('../../../assets/licenses.json');
    mockRequest.flush(createLicensesJson());
    fixture.autoDetectChanges();
    tick();

    const cardElements = fixture.debugElement.queryAll(
      By.css('[data-unit="unit-license-card"]')
    );

    expect(
      cardElements[0]
        .query(By.css('[data-unit="unit-license-card-title"]'))
        .nativeElement.innerText.trim()
    ).toEqual('dummypackage1');
    expect(
      cardElements[0]
        .query(By.css('[data-unit="unit-license-card-subtitle"]'))
        .nativeElement.innerText.trim()
    ).toEqual('WTFPL');
    expect(
      cardElements[0]
        .query(By.css('[data-unit="unit-license-card-content"]'))
        .nativeElement.innerText.trim()
    ).toEqual('Do what ever you want');
  }));

  function createLicensesJson(): LicenseJson {
    return {
      licenses: [
        {
          packageName: 'dummypackage1',
          license: 'WTFPL',
          licenseText: 'Do what ever you want',
        },
        {
          packageName: 'dummypackage2',
          license: 'WTFPL',
          licenseText: 'Do what ever you want',
        },
      ],
    };
  }
});
