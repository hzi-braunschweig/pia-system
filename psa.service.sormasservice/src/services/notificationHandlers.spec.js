const sinon = require('sinon');
const expect = require('chai').expect;
const proxyquire = require('proxyquire');
const startOfToday = require('date-fns/startOfToday');

const questionnaireInstancesServiceStub = (function () {
  return { uploadSingleQuestionnaireInstance: sinon.stub() };
})();

const nH = proxyquire('./notificationHandlers.js', {
  './questionnaireInstancesService.js': questionnaireInstancesServiceStub,
});

describe('notificationsHandlers', function () {
  it('should not upload qis if their state is not worth it', async function () {
    const qInstanceOld = {
      id: 1,
      study_id: 1,
      questionnaire_id: 1,
      questionnaire_name: 'Testname',
      user_id: 'Testuser',
      date_of_issue: startOfToday(),
      status: 'inactive',
      release_version: 1,
    };

    const qInstanceNew = {
      id: 1,
      study_id: 1,
      questionnaire_id: 1,
      questionnaire_name: 'Testname',
      user_id: 'Testuser',
      date_of_issue: startOfToday(),
      status: 'inactive',
      release_version: 2,
    };

    await nH.handleUpdatedInstance(null, qInstanceOld, qInstanceNew);

    expect(
      questionnaireInstancesServiceStub.uploadSingleQuestionnaireInstance
        .callCount
    ).to.equal(0);
  });

  it('should upload qis if their state is one of the released ones', async function () {
    const qInstanceOld = {
      id: 1,
      study_id: 1,
      questionnaire_id: 1,
      questionnaire_name: 'Testname',
      user_id: 'Testuser',
      date_of_issue: startOfToday(),
      status: 'active',
    };

    const qInstanceNew = {
      id: 1,
      study_id: 1,
      questionnaire_id: 1,
      questionnaire_name: 'Testname',
      user_id: 'Testuser',
      date_of_issue: startOfToday(),
      status: 'released_once',
      date_of_release_v1: Date.now(),
    };

    await nH.handleUpdatedInstance(null, qInstanceOld, qInstanceNew);

    expect(
      questionnaireInstancesServiceStub.uploadSingleQuestionnaireInstance
        .callCount
    ).to.equal(1);

    qInstanceOld.status = 'released_twice';
    qInstanceNew.status = 'released_twice';

    await nH.handleUpdatedInstance(null, qInstanceOld, qInstanceNew);

    expect(
      questionnaireInstancesServiceStub.uploadSingleQuestionnaireInstance
        .callCount
    ).to.equal(2);
  });
});
