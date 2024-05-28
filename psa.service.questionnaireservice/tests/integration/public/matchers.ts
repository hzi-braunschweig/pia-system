/* eslint-disable @typescript-eslint/no-invalid-this */
import chai, { expect } from 'chai';
/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { Response } from 'superagent';
import { PostAnswerResponseDto } from '../../../src/controllers/public/dtos/postAnswerDto';

export function publicApiMatchers(): void {
  chai.Assertion.addMethod(
    'failWithError',
    function (error: {
      statusCode: StatusCodes;
      message?: string;
      errorCode?: string;
    }) {
      const obj = this._obj as unknown as Response;

      new chai.Assertion(obj.body).to.deep.include({
        ...(error.errorCode ? { errorCode: error.errorCode } : {}),
        ...(error.message ? { message: error.message } : {}),
        error: getReasonPhrase(error.statusCode),
        statusCode: error.statusCode,
      });
      new chai.Assertion(obj).to.have.status(error.statusCode);
    }
  );

  chai.Assertion.addMethod('failWithInvalidToken', function () {
    const obj = this._obj as unknown as Response;

    new chai.Assertion(obj).to.failWithError({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'No or invalid authorization token provided',
      errorCode: 'INVALID_AUTHORIZATION_TOKEN',
    });
  });

  chai.Assertion.addMethod(
    'failWithNoStudyAccessFor',
    function (studyName: string) {
      const obj = this._obj as unknown as Response;

      new chai.Assertion(obj).to.failWithError({
        statusCode: StatusCodes.FORBIDDEN,
        message: `Requesting user has no access to study "${studyName}"`,
        errorCode: 'MISSING_STUDY_ACCESS',
      });
    }
  );

  chai.Assertion.addMethod(
    'failWithStudyNotFound',
    function (studyName: string) {
      const obj = this._obj as unknown as Response;

      new chai.Assertion(obj).to.failWithError({
        statusCode: StatusCodes.NOT_FOUND,
        message: `Study "${studyName}" does not exist`,
      });
    }
  );

  chai.Assertion.addMethod(
    'failWithInvalidPayload',
    function (andInclude: string) {
      const obj = this._obj as unknown as Response;

      new chai.Assertion(obj).to.failWithError({
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
      });

      expect(obj.body)
        .to.have.property('message')
        .include('Payload is invalid')
        .and.include(andInclude);
    }
  );

  chai.Assertion.addMethod(
    'answersToMatch',
    function (
      expectedAnswers: PostAnswerResponseDto[],
      expectedVersion: number
    ) {
      const body = this._obj as unknown as PostAnswerResponseDto[];

      for (let index = 0; index < body.length; index++) {
        const expected = expectedAnswers[`${index}`];
        const answer = body[`${index}`];
        const assertMessage = `answer #${index + 1} | ${answer.type}`;

        expect(answer.questionVariableName).to.equal(
          expected.questionVariableName
        );
        expect(answer.answerOptionVariableName).to.equal(
          expected.answerOptionVariableName
        );

        if (
          answer.type === 'Image' &&
          expected.value !== null &&
          typeof expected.value === 'object' &&
          'file' in expected.value
        ) {
          expect(answer.value).to.deep.equal(
            {
              file: '',
              fileName: expected.value.fileName,
            },
            assertMessage + ' | value'
          );
        } else {
          expect(answer.value).to.deep.equal(
            expected.value,
            assertMessage + ' | value'
          );
        }
        expect(answer.version).to.equal(
          expectedVersion,
          assertMessage + ' | version'
        );
        expect(answer)
          .to.have.property('dateOfRelease')
          .to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      }
    }
  );
}
