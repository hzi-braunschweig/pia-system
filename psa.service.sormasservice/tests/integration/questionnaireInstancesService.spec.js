const sinon = require('sinon');
const expect = require('chai').expect;
const proxyquire = require('proxyquire').noCallThru();
const startOfToday = require('date-fns/startOfToday');
const format = require('date-fns/format');
const subDays = require('date-fns/subDays');

const { db } = require('../../src/db');

const testQuestionnaire = {
  id: 88888,
  version: 1,
  study_id: 'ApiTestStudie',
  name: 'TestQuestionnaire',
  no_questions: 1,
  cycle_amount: 0,
  cycle_unit: 'once',
  activate_after_days: 0,
  deactivate_after_days: 0,
  notification_tries: 3,
  notification_title: 'title',
  notification_body_new: 'new',
  notification_body_in_progress: 'old',
  notification_weekday: null,
  notification_interval: null,
  notification_interval_unit: null,
  activate_at_date: format(startOfToday(), 'yyyy.MM.dd'),
  created_at: subDays(startOfToday(), 100),
};

const testQuestion = {
  id: 88888,
  questionnaire_id: 88888,
  questionnaire_version: 1,
  text: 'TestQuestion',
  position: 1,
  is_mandatory: false,
};

const testAnswerOption = {
  id: 88888,
  question_id: 88888,
  label: 'fever',
  text: 'TestAnswerOption',
  answer_type_id: 1,
  values: ['Ja', 'Nein'],
  values_code: [1, 0],
  position: 1,
};

const testQuestionnaireInstanceFine1 = {
  id: 88888,
  study_id: 'ApiTestStudie',
  questionnaire_id: 88888,
  questionnaire_name: 'TestQI',
  cycle: 1,
  user_id: 'QTestProband1',
  date_of_issue: new Date(),
  date_of_release_v1: new Date(),
  transmission_ts_v1: null,
  date_of_release_v2: null,
  transmission_ts_v2: null,
  status: 'released_once',
  release_version: 1,
};

const testQuestionnaireInstanceFine2 = {
  id: 88888,
  study_id: 'ApiTestStudie',
  questionnaire_id: 88888,
  questionnaire_name: 'TestQI',
  cycle: 1,
  user_id: 'QTestProband1',
  date_of_issue: new Date(),
  date_of_release_v1: new Date(),
  transmission_ts_v1: new Date(),
  date_of_release_v2: new Date(),
  transmission_ts_v2: null,
  status: 'released_twice',
  release_version: 2,
};

const testQuestionnaireInstanceBad = {
  id: 88888,
  study_id: 'ApiTestStudie',
  questionnaire_id: 88888,
  questionnaire_name: 'TestQI',
  cycle: 1,
  user_id: 'QTestProband1',
  date_of_issue: new Date(),
  date_of_release_v1: null,
  transmission_ts_v1: null,
  date_of_release_v2: null,
  transmission_ts_v2: null,
  status: 'active',
  release_version: 1,
};

const testAnswer = {
  questionnaire_instance_id: 88888,
  question_id: 88888,
  answer_option_id: 88888,
  value: 'Ja',
};

describe('questionnaireInstancesService', function () {
  let sormasClientStub;
  let qIS;

  const cleanup = async function () {
    await db.none('DELETE FROM answers WHERE answer_option_id=88888');
    await db.none(
      'DELETE FROM questionnaire_instances WHERE questionnaire_id=88888'
    );
    await db.none('DELETE FROM answer_options WHERE id=88888');
    await db.none('DELETE FROM questions WHERE id=88888');
    await db.none('DELETE FROM questionnaires WHERE id=88888');
    await db.none('DELETE FROM study_users WHERE user_id=$1', [
      'QTestProband1',
    ]);
    await db.none('DELETE FROM studies WHERE name=$1', ['ApiTestStudie']);
    await db.none('DELETE FROM users WHERE username=$1', ['QTestProband1']);
  };

  const addQI = async function (qi) {
    const versionedTestAnswer = { ...testAnswer };
    versionedTestAnswer.versioning = qi.release_version;
    await db.none(
      'INSERT INTO questionnaire_instances(id, study_id, questionnaire_id, questionnaire_name, cycle, user_id, date_of_issue, date_of_release_v1, date_of_release_v2, status, release_version, transmission_ts_v1, transmission_ts_v2) VALUES(${id}, ${study_id}, ${questionnaire_id}, ${questionnaire_name}, ${cycle}, ${user_id}, ${date_of_issue}, ${date_of_release_v1}, ${date_of_release_v2}, ${status}, ${release_version}, ${transmission_ts_v1}, ${transmission_ts_v2})',
      qi
    );
    await db.none(
      'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value, versioning) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value}, ${versioning})',
      versionedTestAnswer
    );
  };

  beforeEach(async function () {
    await cleanup();
    await db.none(
      'INSERT INTO users (username, password, role, ids) VALUES ($1, $2, $3, $4)',
      ['QTestProband1', 'xxx', 'Proband', 'QTestProband1IDS']
    );
    await db.none('INSERT INTO studies VALUES ($1, $2)', [
      'ApiTestStudie',
      'ApiTestStudie Beschreibung',
    ]);
    await db.none('INSERT INTO study_users VALUES($1, $2, $3)', [
      'ApiTestStudie',
      'QTestProband1',
      'read',
    ]);
    await db.none(
      'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
      testQuestionnaire
    );
    await db.none(
      'INSERT INTO questions(id, questionnaire_id, text, position, is_mandatory) VALUES(${id}, ${questionnaire_id}, ${text}, ${position}, ${is_mandatory})',
      testQuestion
    );
    await db.none(
      'INSERT INTO answer_options(id, question_id, label, text, answer_type_id, values, values_code, position) VALUES(${id}, ${question_id}, ${label}, ${text}, ${answer_type_id}, ${values}, ${values_code}, ${position})',
      testAnswerOption
    );

    sormasClientStub = {
      uploadVisit: sinon.stub().resolves(['OK']),
      getApiVersion: sinon.stub().resolves('1.41.0'),
    };
    qIS = proxyquire('../../src/services/questionnaireInstancesService.js', {
      '../clients/sormasClient': sormasClientStub,
    });
  });

  afterEach(async function () {
    await cleanup();
  });

  it('should find and NOT upload bad questionnaire instances', async function () {
    await addQI(testQuestionnaireInstanceBad);
    await qIS.checkAndUploadQuestionnaireInstances(db);
    expect(sormasClientStub.uploadVisit.callCount).to.equal(0);
  });

  it('should find and upload questionnaire instances v1 with correct data, and mark upload as complete', async function () {
    await addQI(testQuestionnaireInstanceFine1);
    const transmission_ts1 = await db.one(
      'SELECT transmission_ts_v1 FROM questionnaire_instances WHERE id=$1',
      88888
    );
    expect(transmission_ts1.transmission_ts_v1).to.be.null;
    await qIS.checkAndUploadQuestionnaireInstances(db);
    expect(sormasClientStub.uploadVisit.callCount).to.equal(1);
    expect(sormasClientStub.uploadVisit.getCall(0).args[0]).to.equal(
      'QTestProband1IDS'
    );
    expect(sormasClientStub.uploadVisit.getCall(0).args[2]).to.equal(1);
    expect(sormasClientStub.uploadVisit.getCall(0).args[3]).to.eql({
      fever: 'YES',
    });
    const transmission_ts2 = await db.one(
      'SELECT transmission_ts_v1 FROM questionnaire_instances WHERE id=$1',
      88888
    );
    expect(transmission_ts2.transmission_ts_v1).not.to.be.null;
  });

  it('should find and upload questionnaire instances v2 with correct data, and mark upload as complete', async function () {
    await addQI(testQuestionnaireInstanceFine2);
    const transmission_ts1 = await db.one(
      'SELECT transmission_ts_v2 FROM questionnaire_instances WHERE id=$1',
      88888
    );
    expect(transmission_ts1.transmission_ts_v2).to.be.null;
    await qIS.checkAndUploadQuestionnaireInstances(db);
    expect(sormasClientStub.uploadVisit.callCount).to.equal(1);
    expect(sormasClientStub.uploadVisit.getCall(0).args[0]).to.equal(
      'QTestProband1IDS'
    );
    expect(sormasClientStub.uploadVisit.getCall(0).args[2]).to.equal(2);
    expect(sormasClientStub.uploadVisit.getCall(0).args[3]).to.eql({
      fever: 'YES',
    });
    const transmission_ts2 = await db.one(
      'SELECT transmission_ts_v2 FROM questionnaire_instances WHERE id=$1',
      88888
    );
    expect(transmission_ts2.transmission_ts_v2).not.to.be.null;
  });

  it('should wait for SORMAS to be available prior to check', async function () {
    // Arrange
    this.timeout(12000);
    const getApiVersionStub = sinon.stub();
    getApiVersionStub.onCall(0).resolves(null);
    getApiVersionStub.onCall(1).resolves(null);
    getApiVersionStub.resolves('1.41.0');
    sormasClientStub = {
      uploadVisit: sinon.stub().resolves(['OK']),
      getApiVersion: getApiVersionStub,
    };
    qIS = proxyquire('../../src/services/questionnaireInstancesService.js', {
      '../clients/sormasClient': sormasClientStub,
    });

    await addQI(testQuestionnaireInstanceFine1);
    const startTime = Date.now();

    // Act
    await qIS.checkAndUploadQuestionnaireInstances(db);

    // Assert
    expect(sormasClientStub.uploadVisit.callCount).to.equal(1);
    expect(Date.now() - startTime).to.be.at.least(6000);
  });
});
