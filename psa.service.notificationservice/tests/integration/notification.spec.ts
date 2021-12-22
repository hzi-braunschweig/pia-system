/* eslint-disable @typescript-eslint/no-magic-numbers,@typescript-eslint/no-unsafe-member-access */
/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { addMinutes, startOfToday } from 'date-fns';
import { CronJob, CronTime } from 'cron';
import fetchMocker from 'fetch-mock';
import { StatusCodes } from 'http-status-codes';
import JWT from 'jsonwebtoken';
import { DeepPartial, MailService } from '@pia/lib-service-core';

import { FcmHelper } from '../../src/services/fcmHelper';
import { NotificationHelper as notificationHelperTemp } from '../../src/services/notificationHelper';
import { dbWait } from './helper';
import { db } from '../../src/db';
import { cleanup, setup } from './notification.spec.data/setup.helper';
import secretOrPrivateKey from '../secretOrPrivateKey';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { DbUsersToContact } from '../../src/models/usersToContact';
import { QuestionnaireInstance } from '../../src/models/questionnaireInstance';
import { HttpClient } from '@pia-system/lib-http-clients-internal';

const notificationHelper = notificationHelperTemp as {
  sendAllOpenNotifications(): Promise<void>;
  sendSampleReportMails(): Promise<void>;
  checkAndScheduleNotifications(): Promise<void>;
};

chai.use(chaiHttp);
chai.use(sinonChai);

const apiAddress =
  'http://localhost:' + config.public.port.toString() + '/notification';

const fetchMock = fetchMocker.sandbox();
const suiteSandbox = sinon.createSandbox();
const testSandbox = sinon.createSandbox();

const probandSession1 = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband1',
  groups: ['ApiTestStudie'],
};
const probandSession2 = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband2',
  groups: ['ApiTestStudie'],
};

const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher1',
  groups: ['ApiTestStudie'],
};
const utSession = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'QTestUntersuchungsteam',
  groups: ['ApiTestStudie'],
};
const pmSession = {
  id: 1,
  role: 'ProbandenManager',
  username: 'QTestProbandenManager',
  groups: ['ApiTestStudie'],
};
const sysadminSession = {
  id: 1,
  role: 'SysAdmin',
  username: 'QTestSystemAdmin',
  groups: ['ApiTestStudie'],
};

const invalidToken = JWT.sign(probandSession1, 'thisIsNotAValidPrivateKey', {
  algorithm: 'HS256',
  expiresIn: '24h',
});
const probandToken1 = JWT.sign(probandSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const probandToken2 = JWT.sign(probandSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherToken1 = JWT.sign(forscherSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const utToken = JWT.sign(utSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmToken = JWT.sign(pmSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const sysadminToken = JWT.sign(sysadminSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const invalidHeader = { authorization: invalidToken };
const probandHeader1 = { authorization: probandToken1 };
const probandHeader2 = { authorization: probandToken2 };
const forscherHeader1 = { authorization: forscherToken1 };
const utHeader = { authorization: utToken };
const pmHeader = { authorization: pmToken };
const sysadminHeader = { authorization: sysadminToken };

const FcmHelperMock = {
  sendDefaultNotification: sinon.stub().resolves({
    error: undefined,
    exception: undefined,
  }),
};

describe('/notification', function () {
  before(async function () {
    suiteSandbox
      .stub(FcmHelper, 'sendDefaultNotification')
      .callsFake(FcmHelperMock.sendDefaultNotification);
    suiteSandbox.stub(FcmHelper, 'initFBAdmin');
    suiteSandbox.stub(MailService, 'initService');
    suiteSandbox.stub(MailService, 'sendMail').resolves(true);
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    suiteSandbox.restore();
  });

  beforeEach(async function () {
    await setup();
    testSandbox
      .stub<typeof HttpClient, 'fetch'>(HttpClient, 'fetch')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .callsFake(fetchMock);
  });

  afterEach(async function () {
    await cleanup();
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('POST notification', function () {
    const validNotification = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['QTestProband1'],
      date: addMinutes(new Date(), 10).getTime(),
    };

    const validNotificationWithTwoProbands = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['QTestProband1', 'QTestProband4'],
      date: addMinutes(new Date(), 10).getTime(),
    };

    const validForscherNotification = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['QTestForscher1'],
      date: addMinutes(new Date(), 10).getTime(),
    };

    const validNotificationWithoutDate = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['QTestProband1'],
    };

    const noTokenNotification = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['QTestProband2'],
      date: addMinutes(new Date(), 10).getTime(),
    };

    const noStudyNotification = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['QTestProband3'],
      date: addMinutes(new Date(), 10).getTime(),
    };

    const wrongUserNotification = {
      title: 'A valid Notification',
      recipients: ['TestprobandWrong'],
      body: 'A valid body',
      date: addMinutes(new Date(), 10).getTime(),
    };

    it('should return HTTP 401 if the token is invalid', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(invalidHeader)
        .send(validNotification);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(probandHeader1)
        .send(validNotification);
      expect(result).to.have.status(403);
    });

    it('should return a HTTP 200 with "success" === false', async function () {
      fetchMock.get(
        'express:/user/users/TestprobandWrong',
        StatusCodes.NOT_FOUND
      );

      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(pmHeader)
        .send(wrongUserNotification);
      expect(result).to.have.status(200);
      expect(result.body).to.eql({ success: false });
    });

    it('should return HTTP 200 with "success" === false', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(pmHeader)
        .send(noStudyNotification);
      expect(result).to.have.status(200);
      expect(result.body).to.eql({ success: false });
    });

    it('should return HTTP 403 if a SysAdmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(sysadminHeader)
        .send(validNotification);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 with "success" === false', async function () {
      fetchMock.get('express:/user/users/QTestProband2', {});

      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(pmHeader)
        .send(noTokenNotification);
      expect(result).to.have.status(200);
      expect(result.body).to.eql({ success: false });
    });

    it('should return HTTP 403 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(forscherHeader1)
        .send(validNotification);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a UntersuchungsTeam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(utHeader)
        .send(validNotification);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 if a ProbandenManager tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(pmHeader)
        .send(validNotification);
      expect(result).to.have.status(200);
      expect(result.body).to.eql({ success: true });
    });

    it('should return HTTP 200 when sending notification to multiple users', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(pmHeader)
        .send(validNotificationWithTwoProbands);
      expect(result).to.have.status(200);
      expect(result.body).to.eql({ success: true });
    });

    it('should return HTTP 403 if a SysAdmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(sysadminHeader)
        .send(validForscherNotification);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 for a notification without a date', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/notification')
        .set(pmHeader)
        .send(validNotificationWithoutDate);
      expect(result).to.have.status(200);
      expect(result.body).to.eql({ success: true });
    });
  });

  describe('GET notification', function () {
    it('should return HTTP 401 if the token is invalid', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/notification/99997')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 404 if a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/notification/99997')
        .set(forscherHeader1);
      expect(result).to.have.status(404);
    });

    it('should return  HTTP 404 if another proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/notification/99997')
        .set(probandHeader2);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if QProband1 tries for non existing questionnaire instance notification', async function () {
      fetchMock.get('express:/questionnaire/questionnaireInstances/:id', {
        status: StatusCodes.NOT_FOUND,
      });
      const result = await chai
        .request(apiAddress)
        .get('/notification/99996')
        .set(probandHeader1);
      expect(result).to.have.status(404);
      expect(result.body.message).to.equal(
        'Could not get questionnaire instance'
      );
    });

    it('should return HTTP 200 if QProband1 tries for questionnaire notification', async function () {
      fetchMock.get('express:/questionnaire/questionnaireInstances/:id', {
        body: getQuestionnaireInstance9999996(),
      });
      const result = await chai
        .request(apiAddress)
        .get('/notification/99997')
        .set(probandHeader1);
      expect(result).to.have.status(200);
      expect(result.body.notification_type).to.equal('qReminder');
      expect(result.body.reference_id).to.equal('9999996');
      expect(result.body.questionnaire_id).to.equal(99999);
    });

    it('should return HTTP 200 if QProband1 tries for lab result notification', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/notification/99998')
        .set(probandHeader1);
      expect(result).to.have.status(200);
      expect(result.body.notification_type).to.equal('sample');
      expect(result.body.reference_id).to.equal('LAB_RESULT-9999999999');
      expect(result.body.title).to.equal('Neuer Laborbericht!');
    });

    it('should return HTTP 200 if QProband1 tries for custom notification', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/notification/99999')
        .set(probandHeader1);
      expect(result).to.have.status(200);
      expect(result.body.notification_type).to.equal('custom');
      expect(result.body.reference_id).to.equal('');
      expect(result.body.title).to.equal('I am custom title');
    });
  });

  describe('Notifications handling', function () {
    it('should update users_to_contact table if a notable answer is sent', async function () {
      await dbWait(
        'UPDATE questionnaire_instances SET status=${status} WHERE id=${id}',
        {
          status: 'released_once',
          id: 9999996,
        }
      );

      const userToContact = await db.one<DbUsersToContact>(
        "SELECT * FROM users_to_contact WHERE 9999996 = ANY(notable_answer_questionnaire_instances) AND (created_at>=NOW() - INTERVAL '24 HOURS')"
      );

      expect(userToContact.notable_answer_questionnaire_instances).to.include(
        9999996
      );
    });

    it('should insert a notification schedule if the lab results was updated', async function () {
      await dbWait('UPDATE lab_results SET status=${status} WHERE id=${id}', {
        status: 'analyzed',
        id: 'LAB_RESULT-9999999999',
      });

      const schedules = await db.manyOrNone(
        'SELECT * FROM notification_schedules WHERE reference_id = $1',
        ['LAB_RESULT-9999999999']
      );

      expect(schedules.length).equals(2);
    });

    it('should send all open notifications', async function () {
      fetchMock.get('express:/questionnaire/questionnaireInstances/99995', {
        status: StatusCodes.NOT_FOUND,
      });
      fetchMock.get('express:/questionnaire/questionnaireInstances/9999996', {
        body: getQuestionnaireInstance9999996(),
      });
      const logSpy = testSandbox.spy(console, 'log');

      await notificationHelper.sendAllOpenNotifications();

      expect(logSpy).to.have.been.calledWith(
        'Successfully sent scheduled custom notification to: QTestProband1 (1/1 token notified successfull)'
      );

      expect(logSpy).to.have.been.calledWith(
        'Successfully sent sample id (LAB_RESULT-9999999999) notification to: QTestProband1 (1/1 token notified successfull)'
      );

      expect(logSpy).to.have.been.calledWith(
        'Successfully sent instance id (9999996) notification to: QTestProband1 (1/1 token notified successfull)'
      );
    });

    it('should send sample report mails', async function () {
      fetchMock.get('express:/user/pseudonyms', {
        status: StatusCodes.OK,
        body: JSON.stringify(['QTestProband1']),
      });
      await db.none(
        "INSERT INTO lab_results VALUES ('LAB_RESULT-88888', 'QTestProband1', NULL, $1,'new','Das PM merkt an: bitte mit Vorsicht genießen!',FALSE,'Dr. House',NULL)",
        [startOfToday()]
      );

      await db.none(
        "INSERT INTO lab_observations (lab_result_id, name_id, result_value, date_of_announcement) VALUES ('LAB_RESULT-88888', 0, '', $1)",
        [startOfToday()]
      );

      const logSpy = testSandbox.spy(console, 'log');

      await notificationHelper.sendSampleReportMails();

      expect(logSpy).to.have.been.calledWith(
        'Found 1 sampled labresults from yesterday in study ApiTestStudie, which the PM will be informed about'
      );

      expect(logSpy).to.have.been.calledWith(
        'Found 1 analyzed labresults from yesterday in study ApiTestStudie, which the hub will be informed about'
      );

      expect(
        fetchMock.called('express:/user/pseudonyms', {
          query: {
            study: 'ApiTestStudie',
          },
        })
      ).to.be.true;
    });

    it('should check and schedule notifications', async function () {
      const logSpy = testSandbox.spy(console, 'log');

      await notificationHelper.checkAndScheduleNotifications();

      expect(logSpy).to.have.been.calledWith('Found potential qIs: 2');
    });

    it('should run questionnaire cron jobs', async function () {
      const jobs = Server.checkForNotFilledQuestionnairesJobs as unknown as {
        dueQuestionnairesJob: CronJob;
        questionnaireStatusAggregatorJob: CronJob;
      };

      // Force Cronjob to run faster
      jobs.dueQuestionnairesJob.setTime(new CronTime('*/2 * * * * *'));
      jobs.dueQuestionnairesJob.start();

      // Force Cronjob to run faster
      jobs.questionnaireStatusAggregatorJob.setTime(
        new CronTime('*/5 * * * * *')
      );
      jobs.questionnaireStatusAggregatorJob.start();

      // Wait until the cron jobs are executed at least one time
      await new Promise((resolve) => setTimeout(resolve, 8000));

      const usersToContact = await db.manyOrNone(
        'SELECT * FROM users_to_contact'
      );

      expect(
        usersToContact[0].not_filledout_questionnaire_instances
      ).deep.equals([9999997, 9999996]);
      expect(
        usersToContact[0].notable_answer_questionnaire_instances
      ).deep.equals([9999996]);
    }).timeout(10000);
  });
});

function getQuestionnaireInstance9999996(): DeepPartial<QuestionnaireInstance> {
  return {
    id: 9999996,
    studyId: 'ApiTestStudie',
    questionnaireName: 'ApiTestQuestionnaire',
    pseudonym: 'QTestProband1',
    dateOfIssue: new Date('2017-08-08T00:00:00.000Z'),
    dateOfReleaseV1: null,
    dateOfReleaseV2: null,
    cycle: 1,
    status: 'active',
    questionnaire: {
      id: 99999,
      studyId: 'ApiTestStudie',
      name: 'ApiTestQuestionnaire',
      noQuestions: 2,
      cycleAmount: 1,
      cycleUnit: 'week',
      activateAfterDays: 1,
      deactivateAfterDays: 365,
      notificationTries: 3,
      notificationTitle: 'PIA Fragebogen',
      notificationBodyNew: 'NeuNachricht',
      notificationBodyInProgress: 'AltNachricht',
      notificationWeekday: null,
      notificationInterval: null,
      notificationIntervalUnit: null,
      activateAtDate: null,
      complianceNeeded: true,
      notifyWhenNotFilled: true,
      notifyWhenNotFilledTime: '00:00',
      notifyWhenNotFilledDay: 0,
      questions: [{}],
    },
  };
}
