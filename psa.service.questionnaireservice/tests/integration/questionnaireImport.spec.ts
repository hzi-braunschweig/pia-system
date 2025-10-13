/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient } from '@pia-system/lib-http-clients-internal';
import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import fetchMocker from 'fetch-mock';
import { StatusCodes } from 'http-status-codes';
import sinon from 'sinon';
import { DeepPartial } from 'ts-essentials';
import { Repository } from 'typeorm';
import { config } from '../../src/config';
import { dataSource } from '../../src/db';
import { Questionnaire } from '../../src/entities/questionnaire';
import { QuestionnaireJson } from '../../src/models/questionnaireJson';
import { AnswerType } from '../../src/models/answerOption';
import { ConditionType } from '../../src/models/condition';
import {
  assertIsQuestionnaireImportResponseBodyError,
  assertIsQuestionnaireImportResponseBodySuccess,
} from '../../src/models/routes/questionnaireImport';
import { Server } from '../../src/server';
import { cleanup, setup } from './questionnaireImport.spec.data/setup.helper';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const studyName = 'QTestStudy';
const studyName2 = 'QTestStudy2';
const forscherHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: [studyName],
});

const sandbox = sinon.createSandbox();
const fetchMock = fetchMocker.sandbox();

describe('POST /admin/studies/{studyName}/questionnaires-import', () => {
  let repo: Repository<Questionnaire>;
  before(async () => {
    await Server.init();
    repo = dataSource.getRepository(Questionnaire);
  });

  after(async () => {
    await Server.stop();
  });

  beforeEach(async () => {
    await setup();
    // @ts-expect-error use fetch-mock to mock fetch requests
    sandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);

    AuthServerMock.adminRealm().returnValid();
  });

  afterEach(async () => {
    await cleanup();
    sandbox.restore();
    fetchMock.restore();

    AuthServerMock.cleanAll();
  });

  it('should not except an empty request to import', async () => {
    const result = await chai
      .request(apiAddress)
      .post(`/admin/studies/${studyName}/questionnaires-import`)
      .set(forscherHeader)
      .send({});

    expect(result).to.have.status(StatusCodes.BAD_REQUEST);
  });

  it('should return an error for an invalid json', async () => {
    const result = await chai
      .request(apiAddress)
      .post(`/admin/studies/${studyName}/questionnaires-import`)
      .set(forscherHeader)
      .send({
        publishMode: 'adapt',
        questionnaireFiles: [
          {
            name: 'testQuestionnaire.json',
            content: 'text without quotes',
          },
        ],
      });

    expect(result).to.have.status(StatusCodes.OK);
    assertIsQuestionnaireImportResponseBodyError(result.body);
    const body = result.body;
    expect(body.errors).to.have.length(1);
    expect(body.errors[0].name).to.equal('testQuestionnaire.json');
    expect(body.errors[0].errorCode).to.equal('IMPORT_JSON_PARSE_ERROR');
  });

  it('should return an error for an invalid json schema', async () => {
    const result = await chai
      .request(apiAddress)
      .post(`/admin/studies/${studyName}/questionnaires-import`)
      .set(forscherHeader)
      .send({
        publishMode: 'adapt',
        questionnaireFiles: [
          {
            name: 'testQuestionnaire.json',
            content: JSON.stringify({ foo: 'bar' }),
          },
        ],
      });

    expect(result).to.have.status(StatusCodes.OK);
    assertIsQuestionnaireImportResponseBodyError(result.body);
    const body = result.body;
    expect(body.errors).to.have.length(1);
    expect(body.errors[0].name).to.equal('testQuestionnaire.json');
    expect(body.errors[0].errorCode, body.errors[0].message).to.equal(
      'IMPORT_JSON_SCHEMA_INVALID'
    );
  });

  it('should return an error for a questionnaire with an existing custom name', async () => {
    const customName = 'my-custom-name';
    await saveNewQuestionnaire({ customName });
    const jsonQuestionnaire = generateQuestionnaireJson();
    jsonQuestionnaire.custom_name = customName;

    const result = await chai
      .request(apiAddress)
      .post(`/admin/studies/${studyName}/questionnaires-import`)
      .set(forscherHeader)
      .send({
        publishMode: 'adapt',
        questionnaireFiles: [
          {
            name: 'testQuestionnaire.json',
            content: JSON.stringify(jsonQuestionnaire),
          },
        ],
      });

    expect(result).to.have.status(StatusCodes.OK);
    assertIsQuestionnaireImportResponseBodyError(result.body);
    const body = result.body;
    expect(body.errors).to.have.length(1);
    expect(body.errors[0].name).to.equal('testQuestionnaire.json');
    expect(body.errors[0].errorCode, body.errors[0].message).to.equal(
      'DUPLICATE_QUESTIONNAIRE_KEY'
    );
  });

  it('should import a simple questionnaire', async () => {
    const jsonQuestionnaire = generateQuestionnaireJson();

    const result = await chai
      .request(apiAddress)
      .post(`/admin/studies/${studyName}/questionnaires-import`)
      .set(forscherHeader)
      .send({
        publishMode: 'adapt',
        questionnaireFiles: [
          {
            name: 'testQuestionnaire.json',
            content: JSON.stringify(jsonQuestionnaire),
          },
        ],
      });

    expect(result).to.have.status(StatusCodes.OK);
    assertIsQuestionnaireImportResponseBodySuccess(result.body);
    const body = result.body;
    expect(body).not.to.have.property('errors');

    const storedQuestionnaire = await repo.findOne({
      where: { studyId: studyName, name: jsonQuestionnaire.name },
      relations: {
        condition: true,
        questions: {
          condition: true,
          answerOptions: { condition: true },
        },
      },
    });
    expect(storedQuestionnaire.customName).to.equal(
      jsonQuestionnaire.custom_name
    );
    expect(storedQuestionnaire.questions).to.have.length(1);
    expect(storedQuestionnaire.questions[0].answerOptions).to.have.length(1);
    expect(storedQuestionnaire.condition).to.be.null;
  });

  it('should generate a custom name if none is provided', async () => {
    const jsonQuestionnaire = generateQuestionnaireJson();
    jsonQuestionnaire.custom_name = null;

    const result = await chai
      .request(apiAddress)
      .post(`/admin/studies/${studyName}/questionnaires-import`)
      .set(forscherHeader)
      .send({
        publishMode: 'adapt',
        questionnaireFiles: [
          {
            name: 'testQuestionnaire.json',
            content: JSON.stringify(jsonQuestionnaire),
          },
        ],
      });

    expect(result).to.have.status(StatusCodes.OK);
    assertIsQuestionnaireImportResponseBodySuccess(result.body);
    const body = result.body;
    expect(body).not.to.have.property('errors');

    const storedQuestionnaire = await repo.findOne({
      where: { studyId: studyName, name: jsonQuestionnaire.name },
      relations: {
        condition: true,
        questions: {
          condition: true,
          answerOptions: { condition: true },
        },
      },
    });
    expect(storedQuestionnaire.customName).to.be.a('string');
    expect(storedQuestionnaire.questions).to.have.length(1);
    expect(storedQuestionnaire.questions[0].answerOptions).to.have.length(1);
    expect(storedQuestionnaire.condition).to.be.null;
  });

  it('should import a questionnaire and overwrite the publish attribute if publishMode is "hidden"', async () => {
    const jsonQuestionnaire = generateQuestionnaireJson();
    jsonQuestionnaire.publish = 'allaudiences';

    const result = await chai
      .request(apiAddress)
      .post(`/admin/studies/${studyName}/questionnaires-import`)
      .set(forscherHeader)
      .send({
        publishMode: 'hidden',
        questionnaireFiles: [
          {
            name: 'testQuestionnaire.json',
            content: JSON.stringify(jsonQuestionnaire),
          },
        ],
      });

    expect(result).to.have.status(StatusCodes.OK);
    assertIsQuestionnaireImportResponseBodySuccess(result.body);
    const body = result.body;
    expect(body).not.to.have.property('errors');

    const storedQuestionnaire = await repo.findOne({
      where: { studyId: studyName, name: jsonQuestionnaire.name },
    });
    expect(storedQuestionnaire.publish).to.equal('hidden');
  });

  it('should return an error if a condition points to a non-existing questionnaire', async () => {
    const jsonQuestionnaire = generateQuestionnaireJson();
    jsonQuestionnaire.condition = {
      type: ConditionType.EXTERNAL,
      target_questionnaire_custom_name: 'non-existing',
      target_answer_option_variable_name: 'ao-variable-name',
      operand: '==',
      value: '1',
      link: 'OR',
    };

    const result = await chai
      .request(apiAddress)
      .post(`/admin/studies/${studyName}/questionnaires-import`)
      .set(forscherHeader)
      .send({
        publishMode: 'adapt',
        questionnaireFiles: [
          {
            name: 'testQuestionnaire.json',
            content: JSON.stringify(jsonQuestionnaire),
          },
        ],
      });

    expect(result).to.have.status(StatusCodes.OK);
    assertIsQuestionnaireImportResponseBodyError(result.body);
    const body = result.body;
    expect(body.errors).to.have.length(1);
    expect(body.errors[0].name).to.equal('testQuestionnaire.json');
    expect(body.errors[0].errorCode, body.errors[0].message).to.equal(
      'IMPORT_CONDITION_QUESTIONNAIRE_REFERENCE_ERROR'
    );
  });

  it('should return an error if a condition points to a non-existing answer option in the target questionnaire', async () => {
    const targetQuestionnaire = await saveNewQuestionnaire();
    const jsonQuestionnaire = generateQuestionnaireJson();
    jsonQuestionnaire.condition = {
      type: ConditionType.EXTERNAL,
      target_questionnaire_custom_name: targetQuestionnaire.customName,
      target_answer_option_variable_name: 'non-existing',
      operand: '==',
      value: '1',
      link: 'OR',
    };

    const result = await chai
      .request(apiAddress)
      .post(`/admin/studies/${studyName}/questionnaires-import`)
      .set(forscherHeader)
      .send({
        publishMode: 'adapt',
        questionnaireFiles: [
          {
            name: 'testQuestionnaire.json',
            content: JSON.stringify(jsonQuestionnaire),
          },
        ],
      });

    expect(result).to.have.status(StatusCodes.OK);
    assertIsQuestionnaireImportResponseBodyError(result.body);
    const body = result.body;
    expect(body.errors).to.have.length(1);
    expect(body.errors[0].name).to.equal('testQuestionnaire.json');
    expect(body.errors[0].errorCode, body.errors[0].message).to.equal(
      'IMPORT_CONDITION_ANSWER_OPTION_REFERENCE_ERROR'
    );
    expect(body.errors[0].message).to.contain('answer');
  });

  it('should create a questionnaire with an external condition for the questionnaire', async () => {
    const targetQuestionnaire = await saveNewQuestionnaire();
    const jsonQuestionnaire = generateQuestionnaireJson();
    jsonQuestionnaire.condition = {
      type: ConditionType.EXTERNAL,
      target_questionnaire_custom_name: targetQuestionnaire.customName,
      target_answer_option_variable_name:
        targetQuestionnaire.questions[0].answerOptions[0].variableName,
      operand: '==',
      value: '1',
      link: 'OR',
    };

    const result = await chai
      .request(apiAddress)
      .post(`/admin/studies/${studyName}/questionnaires-import`)
      .set(forscherHeader)
      .send({
        publishMode: 'adapt',
        questionnaireFiles: [
          {
            name: 'testQuestionnaire.json',
            content: JSON.stringify(jsonQuestionnaire),
          },
        ],
      });

    expect(result).to.have.status(StatusCodes.OK);
    assertIsQuestionnaireImportResponseBodySuccess(result.body);

    const storedQuestionnaire = await repo.findOne({
      where: { studyId: studyName, name: jsonQuestionnaire.name },
      relations: { condition: true },
    });
    expect(storedQuestionnaire.name).to.equal(jsonQuestionnaire.name);
    expect(storedQuestionnaire.customName).to.equal(
      jsonQuestionnaire.custom_name
    );
    expect(storedQuestionnaire.condition).not.to.be.null;
    expect(storedQuestionnaire.condition.type).to.equal(ConditionType.EXTERNAL);
  });

  it('should not create a questionnaire with an external condition for the questionnaire in a different study', async () => {
    const targetQuestionnaire = await saveNewQuestionnaire({
      studyId: studyName2,
    });
    const jsonQuestionnaire = generateQuestionnaireJson();
    jsonQuestionnaire.condition = {
      type: ConditionType.EXTERNAL,
      target_questionnaire_custom_name: targetQuestionnaire.customName,
      target_answer_option_variable_name:
        targetQuestionnaire.questions[0].answerOptions[0].variableName,
      operand: '==',
      value: '1',
      link: 'OR',
    };

    const result = await chai
      .request(apiAddress)
      .post(`/admin/studies/${studyName}/questionnaires-import`)
      .set(forscherHeader)
      .send({
        publishMode: 'adapt',
        questionnaireFiles: [
          {
            name: 'testQuestionnaire.json',
            content: JSON.stringify(jsonQuestionnaire),
          },
        ],
      });

    expect(result).to.have.status(StatusCodes.OK);
    assertIsQuestionnaireImportResponseBodyError(result.body);
    const body = result.body;
    expect(body.errors).to.have.length(1);
    expect(body.errors[0].name).to.equal('testQuestionnaire.json');
    expect(body.errors[0].errorCode).to.equal(
      'IMPORT_CONDITION_QUESTIONNAIRE_REFERENCE_ERROR'
    );
  });

  it('should create a questionnaire with an external condition for the question', async () => {
    const targetQuestionnaire = await saveNewQuestionnaire();
    const jsonQuestionnaire = generateQuestionnaireJson();
    jsonQuestionnaire.questions[0].condition = {
      type: ConditionType.EXTERNAL,
      target_questionnaire_custom_name: targetQuestionnaire.customName,
      target_answer_option_variable_name:
        targetQuestionnaire.questions[0].answerOptions[0].variableName,
      operand: '==',
      value: '1',
      link: 'OR',
    };

    const result = await chai
      .request(apiAddress)
      .post(`/admin/studies/${studyName}/questionnaires-import`)
      .set(forscherHeader)
      .send({
        publishMode: 'adapt',
        questionnaireFiles: [
          {
            name: 'testQuestionnaire.json',
            content: JSON.stringify(jsonQuestionnaire),
          },
        ],
      });

    expect(result).to.have.status(StatusCodes.OK);
    assertIsQuestionnaireImportResponseBodySuccess(result.body);

    const storedQuestionnaire = await repo.findOne({
      where: { studyId: studyName, name: jsonQuestionnaire.name },
      relations: {
        questions: {
          condition: true,
        },
      },
    });
    expect(storedQuestionnaire.name).to.equal(jsonQuestionnaire.name);
    expect(storedQuestionnaire.customName).to.equal(
      jsonQuestionnaire.custom_name
    );
    expect(storedQuestionnaire.questions[0].condition).not.to.be.null;
    expect(storedQuestionnaire.questions[0].condition.type).to.equal(
      ConditionType.EXTERNAL
    );
  });

  it('should create a questionnaire with an external condition for the answer option', async () => {
    const targetQuestionnaire = await saveNewQuestionnaire();
    const jsonQuestionnaire = generateQuestionnaireJson();
    jsonQuestionnaire.questions[0].answer_options[0].condition = {
      type: ConditionType.EXTERNAL,
      target_questionnaire_custom_name: targetQuestionnaire.customName,
      target_answer_option_variable_name:
        targetQuestionnaire.questions[0].answerOptions[0].variableName,
      operand: '==',
      value: '1',
      link: 'OR',
    };

    const result = await chai
      .request(apiAddress)
      .post(`/admin/studies/${studyName}/questionnaires-import`)
      .set(forscherHeader)
      .send({
        publishMode: 'adapt',
        questionnaireFiles: [
          {
            name: 'testQuestionnaire.json',
            content: JSON.stringify(jsonQuestionnaire),
          },
        ],
      });

    expect(result).to.have.status(StatusCodes.OK);
    assertIsQuestionnaireImportResponseBodySuccess(result.body);

    const storedQuestionnaire = await repo.findOne({
      where: { studyId: studyName, name: jsonQuestionnaire.name },
      relations: {
        questions: {
          answerOptions: { condition: true },
        },
      },
    });
    expect(storedQuestionnaire.name).to.equal(jsonQuestionnaire.name);
    expect(storedQuestionnaire.customName).to.equal(
      jsonQuestionnaire.custom_name
    );
    expect(storedQuestionnaire.questions[0].answerOptions[0].condition).not.to
      .be.null;
    expect(
      storedQuestionnaire.questions[0].answerOptions[0].condition.type
    ).to.equal(ConditionType.EXTERNAL);
  });

  it('should create a questionnaire with an internal_this condition for the question', async () => {
    const jsonQuestionnaire = generateQuestionnaireJson();
    jsonQuestionnaire.questions = [
      {
        text: 'How are you feeling?',
        variable_name: 'qtest-2',
        answer_options: [
          {
            text: 'Really good?',
            variable_name: 'ao211',
            answer_type_id: 1,
            is_notable: [],
            values: ['yes', 'no'],
            values_code: [1, 0],
          },
        ],
      },
      {
        text: "what's the reason?",
        variable_name: 'reason',
        answer_options: [
          {
            text: 'write something',
            variable_name: 'ao221',
            answer_type_id: 4,
            is_notable: [],
            values: [],
            values_code: [],
          },
        ],
        condition: {
          type: ConditionType.INTERNAL_THIS,
          target_question_pos: 1,
          target_answer_option_pos: 1,
          operand: '==',
          value: '1',
          link: 'OR',
        },
      },
    ];

    const result = await chai
      .request(apiAddress)
      .post(`/admin/studies/${studyName}/questionnaires-import`)
      .set(forscherHeader)
      .send({
        publishMode: 'adapt',
        questionnaireFiles: [
          {
            name: 'testQuestionnaire.json',
            content: JSON.stringify(jsonQuestionnaire),
          },
        ],
      });

    expect(result).to.have.status(StatusCodes.OK);
    assertIsQuestionnaireImportResponseBodySuccess(result.body);

    const storedQuestionnaire = await repo.findOne({
      where: { studyId: studyName, name: jsonQuestionnaire.name },
      relations: {
        questions: {
          answerOptions: true,
          condition: {
            targetAnswerOption: true,
            targetQuestionnaire: true,
          },
        },
      },
      order: {
        questions: {
          position: 'ASC',
        },
      },
    });
    expect(storedQuestionnaire.name).to.equal(jsonQuestionnaire.name);
    expect(storedQuestionnaire.customName).to.equal(
      jsonQuestionnaire.custom_name
    );
    expect(storedQuestionnaire.questions[1].condition).not.to.be.null;
    expect(storedQuestionnaire.questions[1].condition.type).to.equal(
      ConditionType.INTERNAL_THIS
    );
    expect(storedQuestionnaire.questions[1].condition.targetAnswerOption).not.to
      .be.null;
    expect(storedQuestionnaire.questions[1].condition.targetQuestionnaire).not
      .to.be.null;
    expect(
      storedQuestionnaire.questions[1].condition.targetQuestionnaire.id
    ).to.equal(storedQuestionnaire.id);
    expect(
      storedQuestionnaire.questions[1].condition.targetAnswerOption.id
    ).to.equal(storedQuestionnaire.questions[0].answerOptions[0].id);
  });

  it('should create a questionnaire with an internal_this condition for the question', async () => {
    const jsonQuestionnaire = generateQuestionnaireJson();
    jsonQuestionnaire.questions = [
      {
        text: 'How are you feeling?',
        variable_name: 'qtest-2',
        answer_options: [
          {
            text: 'Really good?',
            variable_name: 'ao211',
            answer_type_id: 1,
            is_notable: [],
            values: ['yes', 'no'],
            values_code: [1, 0],
          },
        ],
      },
      {
        text: "what's the reason?",
        variable_name: 'reason',
        answer_options: [
          {
            text: 'write something',
            variable_name: 'ao221',
            answer_type_id: 4,
            is_notable: [],
            values: [],
            values_code: [],
          },
        ],
        condition: {
          type: ConditionType.INTERNAL_LAST,
          target_question_pos: 1,
          target_answer_option_pos: 1,
          operand: '==',
          value: '1',
          link: 'OR',
        },
      },
    ];

    const result = await chai
      .request(apiAddress)
      .post(`/admin/studies/${studyName}/questionnaires-import`)
      .set(forscherHeader)
      .send({
        publishMode: 'adapt',
        questionnaireFiles: [
          {
            name: 'testQuestionnaire.json',
            content: JSON.stringify(jsonQuestionnaire),
          },
        ],
      });

    expect(result).to.have.status(StatusCodes.OK);
    assertIsQuestionnaireImportResponseBodySuccess(result.body);
    const storedQuestionnaire = await repo.findOne({
      where: { studyId: studyName, name: jsonQuestionnaire.name },
      relations: {
        questions: {
          answerOptions: true,
          condition: {
            targetAnswerOption: true,
            targetQuestionnaire: true,
          },
        },
      },
      order: {
        questions: {
          position: 'ASC',
        },
      },
    });
    expect(storedQuestionnaire.name).to.equal(jsonQuestionnaire.name);
    expect(storedQuestionnaire.customName).to.equal(
      jsonQuestionnaire.custom_name
    );
    expect(storedQuestionnaire.questions[1].condition).not.to.be.null;
    expect(storedQuestionnaire.questions[1].condition.type).to.equal(
      ConditionType.INTERNAL_LAST
    );
    expect(storedQuestionnaire.questions[1].condition.targetAnswerOption).not.to
      .be.null;
    expect(storedQuestionnaire.questions[1].condition.targetQuestionnaire).not
      .to.be.null;
    expect(
      storedQuestionnaire.questions[1].condition.targetQuestionnaire.id
    ).to.equal(storedQuestionnaire.id);
    expect(
      storedQuestionnaire.questions[1].condition.targetAnswerOption.id
    ).to.equal(storedQuestionnaire.questions[0].answerOptions[0].id);
  });
});

async function saveNewQuestionnaire(
  questionnaire: DeepPartial<Questionnaire> = {}
): Promise<Questionnaire> {
  const repo = dataSource.getRepository(Questionnaire);
  const generated = repo.create({
    name: 'QTest-1',
    studyId: studyName,
    noQuestions: 0,
    customName: 'qtest-1',
    activateAfterDays: 0,
    deactivateAfterDays: 0,
    notificationTries: 0,
    notificationTitle: '',
    notificationBodyNew: '',
    notificationBodyInProgress: '',
    questions: [
      {
        text: 'Feelings',
        position: 1,
        answerOptions: [
          {
            position: 1,
            text: ' how do you feel?',
            variableName: 'ao111',
            answerTypeId: AnswerType.SingleSelect,
            values: ['good', 'bad'],
            valuesCode: [0, 1],
          },
        ],
      },
    ],
    ...questionnaire,
  });
  return await repo.save(generated);
}

function generateQuestionnaireJson(): DeepPartial<QuestionnaireJson> {
  return {
    name: 'QTest-2',
    custom_name: 'q-test-custom-name',
    publish: 'allaudiences',
    activate_after_days: 0,
    deactivate_after_days: 5,
    expires_after_days: 2,
    finalises_after_days: 5,
    notification_tries: 0,
    questions: [
      {
        text: 'How are you feeling?',
        variable_name: 'qtest-2',
        answer_options: [
          {
            text: 'Really good?',
            variable_name: 'ao211',
            answer_type_id: 1,
            is_notable: [],
            values: ['yes', 'no'],
            values_code: [1, 0],
          },
        ],
      },
    ],
  };
}
