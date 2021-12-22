/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  AccountCreateError,
  IdsAlreadyExistsError,
  ProbandSaveError,
} from '../../errors';
import { InternalProbandsInteractor } from './internalProbandsInteractor';
import { ProbandService } from '../../services/probandService';
import { createSandbox } from 'sinon';
import { expect } from 'chai';
import { Boom } from '@hapi/boom';
import { assert } from 'ts-essentials';
import { StatusCodes } from 'http-status-codes';
import { CreateProbandRequest } from '../../models/proband';

describe('InternalProbandsInteractor', () => {
  const testSandbox = createSandbox();

  afterEach(() => {
    testSandbox.restore();
  });

  describe('createProband', () => {
    it('should throw 500 if getting an error that IDS already exists', async () => {
      testSandbox
        .stub(ProbandService, 'createProbandWithAccount')
        .rejects(new IdsAlreadyExistsError('test'));
      try {
        await InternalProbandsInteractor.createProband(
          'AnyStudy',
          createCreateProbandRequest()
        );
        expect(true).to.be.false; // should throw an error before
      } catch (e) {
        assert(e instanceof Boom);
        expect(e.output.statusCode).to.equal(StatusCodes.CONFLICT);
      }
    });

    it('should throw 500 if getting an unexpected error (AccountCreateError)', async () => {
      testSandbox
        .stub(ProbandService, 'createProbandWithAccount')
        .rejects(new AccountCreateError('test'));
      try {
        await InternalProbandsInteractor.createProband(
          'AnyStudy',
          createCreateProbandRequest()
        );
        expect(true).to.be.false; // should throw an error before
      } catch (e) {
        assert(e instanceof Boom);
        expect(e.output.statusCode).to.equal(StatusCodes.INTERNAL_SERVER_ERROR);
      }
    });

    it('should throw 500 if getting an unexpected error (ProbandSaveError)', async () => {
      testSandbox
        .stub(ProbandService, 'createProbandWithAccount')
        .rejects(new ProbandSaveError('test'));
      try {
        await InternalProbandsInteractor.createProband(
          'AnyStudy',
          createCreateProbandRequest()
        );
        expect(true).to.be.false; // should throw an error before
      } catch (e) {
        assert(e instanceof Boom);
        expect(e.output.statusCode).to.equal(StatusCodes.INTERNAL_SERVER_ERROR);
      }
    });

    it('should throw 500 if getting an unexpected error (any)', async () => {
      testSandbox
        .stub(ProbandService, 'createProbandWithAccount')
        .rejects(new Error('test'));
      try {
        await InternalProbandsInteractor.createProband(
          'AnyStudy',
          createCreateProbandRequest()
        );
        expect(true).to.be.false; // should throw an error before
      } catch (e) {
        assert(e instanceof Boom);
        expect(e.output.statusCode).to.equal(StatusCodes.INTERNAL_SERVER_ERROR);
      }
    });
  });
});

function createCreateProbandRequest(
  overwrite: Partial<CreateProbandRequest> = {}
): CreateProbandRequest {
  return {
    pseudonym: 'TestProband',
    complianceBloodsamples: false,
    complianceLabresults: false,
    complianceSamples: false,
    ...overwrite,
  };
}
