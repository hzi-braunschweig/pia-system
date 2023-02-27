/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { LegacyAnswersTransform } from './legacyAnswersTransform';
import { FullAnswer } from '../../models/answer';
import { AnswerType } from '../../models/answerOption';
import sinon, { createSandbox } from 'sinon';

describe('LegacyAnswersTransform', () => {
  let transform: LegacyAnswersTransform;
  const sandbox = createSandbox();

  beforeEach(() => {
    transform = new LegacyAnswersTransform();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should throw an error if date could not be converted', () => {
    const answer: FullAnswer | { date_of_issue: string } = {
      questionnaire_name: 'string',
      questionnaire_version: 1,
      user_id: 'string',
      date_of_release_v1: null,
      date_of_release_v2: null,
      date_of_issue: new Date(),
      status: 'active',
      question_variable_name: 'string',
      qposition: 1,
      answer_option_variable_name: 'string',
      aposition: 1,
      values: null,
      values_code: null,
      versioning: null,
      date_of_release: null,
      ids: 'string',
      a_type: AnswerType.Date,
      value: 'not a date',
    };
    const error = sandbox.spy(console, 'error');

    transform._transform(answer, 'utf8', () => null);
    sinon.assert.calledWith(error, 'Could not parse the date', answer.value);

    answer.a_type = AnswerType.Timestamp;
    answer.value = 'not a timestamp';

    transform._transform(answer, 'utf8', () => null);
    sinon.assert.calledWith(
      error,
      'Could not parse the timestamp',
      answer.value
    );
  });
});
