/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { fakeAsync, tick } from '@angular/core/testing';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';

import { AppModule } from '../../../app.module';
import { ScanDialogComponent } from './scan-dialog.component';
import { Study } from '../../../psa.app.core/models/study';

describe('ScanDialogComponent', () => {
  let fixture: MockedComponentFixture;
  let component: ScanDialogComponent;

  beforeEach(async () => {
    // Build Base Module
    await MockBuilder(ScanDialogComponent, [AppModule, MAT_DIALOG_DATA]).mock(
      MAT_DIALOG_DATA,
      {
        isBloodSample: true,
        study: createStudy(),
      }
    );
  });

  beforeEach(fakeAsync(() => {
    // Create component
    fixture = MockRender(ScanDialogComponent);
    component = fixture.point.componentInstance;
    tick(); // wait for ngOnInit to finish
  }));

  describe('scan form', () => {
    it('should be initialized', () => {
      expect(component.scanForm).toBeDefined();
      expect(component.scanForm.get('sample_id').value).toEqual('');
      expect(component.scanForm.get('dummy_sample_id').value).toEqual('');
      expect(component.scanForm.get('dummy_sample_id').disabled).toBeTrue();
    });

    it('should validate an incorrect sample id', () => {
      component.scanForm.get('sample_id').setValue('BLUB');

      expect(component.scanForm.valid).toBeFalse();
      expect(
        component.scanForm.get('sample_id').hasError('sampleWrongFormat')
      ).toBeTrue();
    });

    it('should validate a correct sample id', () => {
      component.scanForm.get('sample_id').setValue('TEST-123');

      expect(component.scanForm.valid).toBeTrue();
      expect(
        component.scanForm.get('sample_id').hasError('sampleWrongFormat')
      ).toBeFalse();
    });
  });

  describe('hasDummySampleId()', () => {
    it('should return false', () => {
      expect(component.hasDummySampleId()).toBeFalse();
    });
  });

  describe('getScanResult()', () => {
    it('should return the scan result', () => {
      component.scanForm.get('sample_id').setValue('TEST-123');
      expect(component.getScanResult()).toEqual({
        sample_id: 'TEST-123',
        dummy_sample_id: undefined,
      });
    });
  });

  function createStudy(): Study {
    return {
      name: 'Teststudy',
      has_rna_samples: true,
      sample_prefix: 'TEST',
      sample_suffix_length: 3,
    } as Study;
  }
});
