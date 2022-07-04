/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';

import { AccountClientService } from './account-client.service';
import { EndpointService } from '../../shared/services/endpoint/endpoint.service';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import SpyObj = jasmine.SpyObj;
import { DeletionType } from './deletion-type.enum';

describe('AccountClientService', () => {
  let service: AccountClientService;
  let endpoint: SpyObj<EndpointService>;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    endpoint = jasmine.createSpyObj('EndpointService', ['getUrl']);
    endpoint.getUrl.and.returnValue('http://localhost');

    TestBed.configureTestingModule({
      providers: [{ provide: EndpointService, useValue: endpoint }],

      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(AccountClientService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('deleteAccount', () => {
    [
      { pseudonym: 'test-1', deletionType: DeletionType.FULL },
      { pseudonym: 'test-2', deletionType: DeletionType.CONTACT },
    ].forEach(({ pseudonym, deletionType }) => {
      it(`should send delete request for deletionType: ${deletionType}`, async () => {
        const call = service.deleteAccount(pseudonym, deletionType);
        const req = httpTestingController.expectOne(
          endpoint.getUrl() +
            '/api/v1/user/probands/' +
            pseudonym +
            '/account?deletionType=' +
            deletionType
        );
        req.flush('');

        await call;

        expect(req.request.method).toEqual('DELETE');

        httpTestingController.verify();
      });
    });
  });
});
