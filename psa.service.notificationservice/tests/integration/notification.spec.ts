/* eslint-disable @typescript-eslint/no-magic-numbers,@typescript-eslint/no-unsafe-member-access */
/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import fbAdmin, { FirebaseError } from 'firebase-admin';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { addDays, addMinutes, startOfToday } from 'date-fns';
import fetchMocker from 'fetch-mock';
import * as Mockdate from 'mockdate';
import { StatusCodes } from 'http-status-codes';
import {
  AuthServerMock,
  AuthTokenMockBuilder,
  MailService,
} from '@pia/lib-service-core';

import { FcmHelper } from '../../src/services/fcmHelper';
import { dbWait } from './helper';
import { db } from '../../src/db';
import { cleanup, setup } from './notification.spec.data/setup.helper';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { DbUsersToContact } from '../../src/models/usersToContact';
import { QuestionnaireInstance } from '../../src/models/questionnaireInstance';
import { HttpClient } from '@pia-system/lib-http-clients-internal';
import { Questionnaire } from '../../src/models/questionnaire';
import {
  NotificationResponse,
  DbNotificationSchedules,
  NotificationType,
  QuestionnaireNotificationResponse,
} from '../../src/models/notification';
import ScheduleInstanceNotificationsCronjob from '../../src/cronjobs/scheduleInstanceNotificationsCronjob';
import SendScheduledNotificationsCronjob from '../../src/cronjobs/sendScheduledNotificationsCronjob';
import SendDailySampleReportMailsCronjob from '../../src/cronjobs/sendDailySampleReportMailsCronjob';
import CheckInstancesDueToBeFilledOutCronjob from '../../src/cronjobs/checkInstancesDueToBeFilledOutCronjob';
import SendQuestionnairesStatusAggregatorEmailCronjob from '../../src/cronjobs/sendQuestionnairesStatusAggregatorEmailCronjob';

chai.use(chaiHttp);
chai.use(sinonChai);

const apiAddress = `http://localhost:${config.public.port}`;

const fetchMock = fetchMocker.sandbox();
const suiteSandbox = sinon.createSandbox();
const testSandbox = sinon.createSandbox();

const probandHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['ApiTestStudie'],
});
const probandHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband2',
  studies: ['ApiTestStudie'],
});
const forscherHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: ['ApiTestStudie'],
});
const utHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'qtest-untersuchungsteam',
  studies: ['ApiTestStudie'],
});
const pmHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'qtest-probandenmanager',
  studies: ['ApiTestStudie'],
});
const sysadminHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'qtest-sysadmin',
  studies: ['ApiTestStudie'],
});

describe('/notification', function () {
  let sendMailStub: sinon.SinonStub;
  let fcmHelperGetFirebaseMessagingStub: sinon.SinonStub;
  let firebaseAdminSendStub: sinon.SinonStub;

  before(async function () {
    firebaseAdminSendStub = suiteSandbox.stub().resolves('fcmMessageId');

    fcmHelperGetFirebaseMessagingStub = suiteSandbox
      .stub(FcmHelper, 'getFirebaseMessaging')
      .returns({
        send: firebaseAdminSendStub,
      } as unknown as fbAdmin.messaging.Messaging);

    suiteSandbox.stub(fbAdmin, 'initializeApp');
    suiteSandbox.stub(MailService, 'initService');
    sendMailStub = suiteSandbox.stub(MailService, 'sendMail').resolves(true);
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    suiteSandbox.restore();
  });

  beforeEach(async function () {
    AuthServerMock.probandRealm().returnValid();
    AuthServerMock.adminRealm().returnValid();

    fetchMock.get('express:/questionnaire/questionnaireInstances/99995', {
      status: StatusCodes.NOT_FOUND,
    });

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

    AuthServerMock.cleanAll();
  });

  describe('POST notification', function () {
    const validNotification = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['qtest-proband1'],
      date: addMinutes(new Date(), 10).getTime(),
    };

    const validNotificationWithTwoProbands = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['qtest-proband1', 'qtest-proband4'],
      date: addMinutes(new Date(), 10).getTime(),
    };

    const validForscherNotification = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['qtest-forscher1'],
      date: addMinutes(new Date(), 10).getTime(),
    };

    const validNotificationWithoutDate = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['qtest-proband1'],
    };

    const validNotificationWithUppercaseRecipients = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['QTest-Proband1'],
    };

    const noTokenNotification = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['qtest-proband2'],
      date: addMinutes(new Date(), 10).getTime(),
    };

    const noStudyNotification = {
      title: 'A valid Notification',
      body: 'A valid body',
      recipients: ['qtest-proband3'],
      date: addMinutes(new Date(), 10).getTime(),
    };

    const wrongUserNotification = {
      title: 'A valid Notification',
      recipients: ['TestprobandWrong'],
      body: 'A valid body',
      date: addMinutes(new Date(), 10).getTime(),
    };

    it('should return HTTP 401 if the token is invalid', async function () {
      AuthServerMock.cleanAll();
      AuthServerMock.probandRealm().returnInvalid();

      const result = await chai
        .request(apiAddress)
        .post('/admin/notification')
        .set(probandHeader1)
        .send(validNotification);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/notification')
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
        .post('/admin/notification')
        .set(pmHeader)
        .send(wrongUserNotification);
      expect(result).to.have.status(200);
      expect(result.body).to.eql({ success: false });
    });

    it('should return HTTP 200 with "success" === false', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/notification')
        .set(pmHeader)
        .send(noStudyNotification);
      expect(result).to.have.status(200);
      expect(result.body).to.eql({ success: false });
    });

    it('should return HTTP 403 if a SysAdmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/notification')
        .set(sysadminHeader)
        .send(validNotification);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 with "success" === false', async function () {
      fetchMock.get('express:/user/users/qtest-proband2', {});

      const result = await chai
        .request(apiAddress)
        .post('/admin/notification')
        .set(pmHeader)
        .send(noTokenNotification);
      expect(result).to.have.status(200);
      expect(result.body).to.eql({ success: false });
    });

    it('should return HTTP 403 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/notification')
        .set(forscherHeader1)
        .send(validNotification);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 if a UntersuchungsTeam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/notification')
        .set(utHeader)
        .send(validNotification);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 if a ProbandenManager tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/notification')
        .set(pmHeader)
        .send(validNotification);
      expect(result).to.have.status(200);
      expect(result.body).to.eql({ success: true });
    });

    it('should return HTTP 200 when sending notification to multiple users', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/notification')
        .set(pmHeader)
        .send(validNotificationWithTwoProbands);
      expect(result).to.have.status(200);
      expect(result.body).to.eql({ success: true });
    });

    it('should return HTTP 403 if a SysAdmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/notification')
        .set(sysadminHeader)
        .send(validForscherNotification);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 for a notification without a date', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/notification')
        .set(pmHeader)
        .send(validNotificationWithoutDate);
      expect(result).to.have.status(200);
      expect(result.body).to.eql({ success: true });
    });

    it('should also accept pseudonyms in uppercase and return HTTP 200', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/notification')
        .set(pmHeader)
        .send(validNotificationWithUppercaseRecipients);
      expect(result).to.have.status(200);
      expect(result.body).to.eql({ success: true });
    });
  });

  describe('GET notification', function () {
    it('should return HTTP 401 if the token is invalid', async function () {
      AuthServerMock.cleanAll();
      AuthServerMock.probandRealm().returnInvalid();

      const result = await chai
        .request(apiAddress)
        .get('/notification/99997')
        .set(probandHeader1);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 if a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/notification/99997')
        .set(forscherHeader1);
      expect(result).to.have.status(403);
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

    it('should return HTTP 200 and indicate opening overview, if QProband1 tries for questionnaire notification', async function () {
      const instance = getQuestionnaireInstance9999996();
      const expectedNotification: QuestionnaireNotificationResponse = {
        title: 'PIA Fragebogen',
        body: 'NeuNachricht\n\nKlicken Sie auf "Öffnen", um zur Fragebogen-Übersicht zu gelangen.',
        notification_type: 'qReminder',
        reference_id: '9999996',
        data: {
          linkToOverview: true,
        },
      };

      fetchMock.get('express:/questionnaire/questionnaireInstances/:id', {
        body: {
          ...instance,
          questionnaire: {
            ...instance.questionnaire,
            notificationLinkToOverview: true,
          },
        },
      });

      const result = await chai
        .request(apiAddress)
        .get('/notification/99997')
        .set(probandHeader1);

      expect(result).to.have.status(200);
      expect(result.body).to.deep.equal(expectedNotification);
    });

    it('should return HTTP 200 and indicate opening questionnaire, if QProband1 tries for questionnaire notification', async function () {
      const instance = getQuestionnaireInstance9999996();
      const expectedNotification: QuestionnaireNotificationResponse = {
        title: 'PIA Fragebogen',
        body: 'NeuNachricht\n\nKlicken Sie auf "Öffnen", um direkt zum Fragebogen zu gelangen.',
        notification_type: 'qReminder',
        reference_id: '9999996',
        data: {
          linkToOverview: false,
        },
      };

      fetchMock.get('express:/questionnaire/questionnaireInstances/:id', {
        body: {
          ...instance,
          questionnaire: {
            ...instance.questionnaire,
            notificationLinkToOverview: false,
          },
        },
      });

      const result = await chai
        .request(apiAddress)
        .get('/notification/99997')
        .set(probandHeader1);

      expect(result).to.have.status(200);
      expect(result.body).to.deep.equal(expectedNotification);
    });

    it('should return HTTP 200 if QProband1 tries for lab result notification', async function () {
      const expectedNotification: NotificationResponse = {
        title: 'Neuer Laborbericht!',
        body: 'Eine Ihrer Proben wurde analysiert. Klicken Sie direkt auf diese Nachricht, um das Ergebnis zu öffnen.',
        notification_type: 'sample',
        reference_id: 'LAB_RESULT-9999999999',
      };

      const result = await chai
        .request(apiAddress)
        .get('/notification/99998')
        .set(probandHeader1);

      expect(result).to.have.status(200);
      expect(result.body).to.deep.equal(expectedNotification);
    });

    it('should return HTTP 200 if QProband1 tries for custom notification', async function () {
      const expectedNotification: NotificationResponse = {
        title: 'I am a custom title',
        body: 'Here is\ncustom body',
        notification_type: 'custom',
        reference_id: '',
      };

      const result = await chai
        .request(apiAddress)
        .get('/notification/99999')
        .set(probandHeader1);

      expect(result).to.have.status(200);
      expect(result.body).to.deep.equal(expectedNotification);
    });
  });

  describe('Notifications handling', function () {
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
      fetchMock.get('express:/questionnaire/questionnaireInstances/9999996', {
        body: getQuestionnaireInstance9999996(),
      });
      const logSpy = testSandbox.spy(console, 'log');

      await new SendScheduledNotificationsCronjob().execute();

      expect(logSpy).to.have.been.calledWith(
        'Successfully sent scheduled custom notification to: qtest-proband1 (1/1 token were notified successfully)'
      );

      expect(logSpy).to.have.been.calledWith(
        'Successfully sent sample id (LAB_RESULT-9999999999) notification to: qtest-proband1 (1/1 token were notified successfully)'
      );

      expect(logSpy).to.have.been.calledWith(
        'Successfully sent instance id (9999996) notification to: qtest-proband1 (1/1 token were notified successfully)'
      );
    });

    describe('for questionnaire reminders', () => {
      it('should postpone the notification if the questionnaire instance is empty', async () => {
        const instance = getQuestionnaireInstance9999996();
        fetchMock.get('express:/questionnaire/questionnaireInstances/9999996', {
          body: { ...instance, questionnaire: { questions: [] } },
        });
        const scheduleBefore = await getNotificationSchedule(instance.id);
        const expectedPostponedDate = addDays(scheduleBefore!.send_on!, 1);

        const logSpy = testSandbox.spy(console, 'log');

        await new SendScheduledNotificationsCronjob().execute();

        expect(logSpy).to.have.been.calledWith(
          `The questionnaire of that notification schedule is empty because of conditions, postponing schedule for instance: ${instance.id}`
        );

        const scheduleAfter = await getNotificationSchedule(instance.id);
        expect(scheduleAfter).to.have.property('send_on');
        expect(scheduleAfter!.send_on!.toISOString()).to.be.equal(
          expectedPostponedDate.toISOString()
        );
      });

      it('should delete the notification if the questionnaire instance does not exist anymore', async () => {
        const instance = getQuestionnaireInstance9999996();
        fetchMock.get('express:/questionnaire/questionnaireInstances/9999996', {
          status: StatusCodes.NOT_FOUND,
        });

        const logSpy = testSandbox.spy(console, 'log');

        await new SendScheduledNotificationsCronjob().execute();

        expect(logSpy).to.have.been.calledWith(
          `The questionnaire instance of that notification schedule is not longer present, hase been released or is expired, deleting schedule for instance: ${instance.id}`
        );

        const schedule = await getNotificationSchedule(instance.id);
        expect(schedule).to.be.null;
      });

      it('should postpone the notification if the reminder could not be sent by email', async () => {
        const instance = getQuestionnaireInstance9999996();
        const scheduleBefore = await getNotificationSchedule(instance.id);
        const expectedPostponedDate = addDays(scheduleBefore!.send_on!, 1);

        fetchMock.get('express:/questionnaire/questionnaireInstances/9999996', {
          body: instance,
        });
        fetchMock.get(
          `express:/personal/personalData/proband/${instance.pseudonym}/email`,
          {
            status: StatusCodes.NOT_FOUND,
          }
        );

        await clearFcmTokens();

        const logSpy = testSandbox.spy(console, 'log');

        await new SendScheduledNotificationsCronjob().execute();

        const scheduleAfter = await getNotificationSchedule(instance.id);
        expect(scheduleAfter).to.have.property('send_on');
        expect(scheduleAfter!.send_on!.toISOString()).to.be.equal(
          expectedPostponedDate.toISOString()
        );
        expect(logSpy).to.have.been.calledWith(
          `Error sending either notification or email to user: ${instance.pseudonym} for instance id: ${instance.id}, postponing it`
        );
      });

      it('should postpone the notification if the reminder could not be sent by push', async () => {
        const instance = getQuestionnaireInstance9999996();
        const scheduleBefore = await getNotificationSchedule(instance.id);
        const expectedPostponedDate = addDays(scheduleBefore!.send_on!, 1);

        fetchMock.get('express:/questionnaire/questionnaireInstances/9999996', {
          body: instance,
        });

        firebaseAdminSendStub.rejects(getFirebaseMessagingError('app/no-app'));

        const logSpy = testSandbox.spy(console, 'log');

        await new SendScheduledNotificationsCronjob().execute();

        const scheduleAfter = await getNotificationSchedule(instance.id);
        expect(scheduleAfter).to.have.property('send_on');
        expect(scheduleAfter!.send_on!.toISOString()).to.be.equal(
          expectedPostponedDate.toISOString()
        );
        expect(logSpy).to.have.been.calledWith(
          `Error sending either notification or email to user: ${instance.pseudonym} for instance id: ${instance.id}, postponing it`
        );
      });

      it('should remove the fcm token if the reminder could not be sent by push because the token was rejected', async () => {
        const instance = getQuestionnaireInstance9999996();

        fetchMock.get('express:/questionnaire/questionnaireInstances/9999996', {
          body: instance,
        });

        firebaseAdminSendStub.rejects(
          getFirebaseMessagingError(
            'messaging/registration-token-not-registered'
          )
        );

        const logSpy = testSandbox.spy(console, 'log');

        await new SendScheduledNotificationsCronjob().execute();

        const fcmTokens = await db.manyOrNone(
          'SELECT * FROM fcm_tokens WHERE pseudonym = $1',
          [instance.pseudonym]
        );

        expect(fcmTokens).to.be.empty;

        expect(logSpy).to.have.been.calledWith(
          `Error sending either notification or email to user: ${instance.pseudonym} for instance id: ${instance.id}, postponing it`
        );
      });

      describe('delete schedule by status', () => {
        for (const status of ['released_once', 'released_twice', 'expired']) {
          it(`should delete the notification if the questionnaire status is ${status}`, async () => {
            const instance = getQuestionnaireInstance9999996();
            fetchMock.get(
              'express:/questionnaire/questionnaireInstances/9999996',
              {
                body: { ...instance, status },
              }
            );

            const logSpy = testSandbox.spy(console, 'log');

            await new SendScheduledNotificationsCronjob().execute();

            expect(await getNotificationSchedule(instance.id)).to.be.null;

            expect(logSpy).to.have.been.calledWith(
              `The questionnaire instance of that notification schedule is not longer present, hase been released or is expired, deleting schedule for instance: ${instance.id}`
            );
          });
        }
      });
    });

    it('should send sample report mails', async function () {
      fetchMock.get('express:/user/pseudonyms', {
        status: StatusCodes.OK,
        body: JSON.stringify(['qtest-proband1']),
      });
      await db.none(
        "INSERT INTO lab_results VALUES ('LAB_RESULT-88888', 'qtest-proband1', NULL, $1,'new','Das PM merkt an: bitte mit Vorsicht genießen!',FALSE,'Dr. House',NULL)",
        [startOfToday()]
      );

      await db.none(
        "INSERT INTO lab_observations (lab_result_id, name_id, result_value, date_of_announcement) VALUES ('LAB_RESULT-88888', 0, '', $1)",
        [startOfToday()]
      );

      const logSpy = testSandbox.spy(console, 'log');

      await new SendDailySampleReportMailsCronjob().execute();

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

      await new ScheduleInstanceNotificationsCronjob().execute();

      expect(logSpy).to.have.been.calledWith('Found potential qIs: 2');
    });

    describe('daily questionnaire report', () => {
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

      it('should check for instances which are due to be filled out', async function () {
        await new CheckInstancesDueToBeFilledOutCronjob().execute();

        const usersToContact = await db.manyOrNone(
          'SELECT * FROM users_to_contact WHERE user_id = $1',
          ['qtest-proband1']
        );

        expect(
          usersToContact[0].not_filledout_questionnaire_instances
        ).deep.equals([9999997, 9999996]);
      });

      it('should update an entry for users to contact with notable instances', async function () {
        // Act
        await new CheckInstancesDueToBeFilledOutCronjob().execute();

        // Should trigger a database event, which updates previously created entry in our users_to_contact table
        await dbWait(
          'UPDATE questionnaire_instances SET status=${status} WHERE id=${id}',
          {
            status: 'released_once',
            id: 9999996,
          }
        );

        // Assert
        const usersToContact = await db.manyOrNone(
          'SELECT * FROM users_to_contact WHERE user_id = $1',
          ['qtest-proband1']
        );

        expect(
          usersToContact[0].not_filledout_questionnaire_instances
        ).deep.equals([9999997, 9999996]);

        expect(
          usersToContact[0].notable_answer_questionnaire_instances
        ).deep.equals([9999996]);
      });

      it('should check and schedule questionnaire statistic notifications', async function () {
        // Arrange
        const expectedEmailAddress = 'pm@pia.test';
        const expectedSendOnDate = new Date();
        Mockdate.set(expectedSendOnDate);

        // Act
        await new SendQuestionnairesStatusAggregatorEmailCronjob().execute();

        // Assert
        const scheduledNotifications = (await db.oneOrNone(
          `SELECT * FROM notification_schedules WHERE reference_id = $1`,
          [expectedEmailAddress]
        )) as unknown as DbNotificationSchedules;

        expect(scheduledNotifications).to.deep.contain({
          title: 'PIA - Auffällige und fehlende Eingaben',
          body:
            'Liebes Koordinationsteam,\n\n' +
            '2 Personen haben auffällige Symptome gemeldet.\n' +
            '3 Personen haben nichts gemeldet.\n\n' +
            'Öffnen Sie PIA über https://localhost/admin und melden sich an. ' +
            'Unter „Zu kontaktieren“ können Sie sich Teilnehmende anzeigen ' +
            'lassen, die auffällige Symptome oder nichts gemeldet haben.\n\n' +
            'Bitte treten Sie mit den entsprechenden Personen in Kontakt.',
          notification_type: 'questionnaires_stats_aggregator',
          reference_id: expectedEmailAddress,
          send_on: expectedSendOnDate,
          user_id: null,
        });

        Mockdate.reset();
      });
    });
  });

  describe('Emails', () => {
    const expectedEmailAddress = 'notification@test.local';

    beforeEach(async () => {
      // remove all push notification tokens to force sending emails
      await clearFcmTokens();
      setupParticipantEmailAddress('qtest-proband1', expectedEmailAddress);
    });

    describe('Questionnaire instance reminder', () => {
      beforeEach(async () => {
        await focusOnNotificationType('qReminder');
      });

      it('should send a correct notification email for a questionnaire instance with status is active', async () => {
        const instance = getQuestionnaireInstance9999996();
        const instanceId = instance.id;
        const questionnaireId = instance.questionnaire.id;
        const expectedUrl = `/extlink/questionnaire/${questionnaireId}/${instanceId}`;
        const expectedLinkIntroduction =
          'Klicken Sie auf folgenden Link, um direkt zum Fragebogen zu gelangen:';
        const expectedContent = sinon.match.string
          .and(sinon.match(instance.questionnaire.notificationBodyNew))
          .and(sinon.match(expectedLinkIntroduction))
          .and(sinon.match(expectedUrl));

        setupQuestionnaireInstance({ ...instance, status: 'active' });

        await new SendScheduledNotificationsCronjob().execute();

        expect(sendMailStub).to.have.been.calledWith(
          expectedEmailAddress,
          sinon.match({
            subject: instance.questionnaire.notificationTitle,
            text: expectedContent,
            html: expectedContent,
          })
        );
      });

      it('should send a correct notification email for a questionnaire instance with status is in progress', async () => {
        const instance = getQuestionnaireInstance9999996();
        const instanceId = instance.id;
        const questionnaireId = instance.questionnaire.id;
        const expectedUrl = `/extlink/questionnaire/${questionnaireId}/${instanceId}`;
        const expectedLinkIntroduction =
          'Klicken Sie auf folgenden Link, um direkt zum Fragebogen zu gelangen:';
        const expectedContent = sinon.match.string
          .and(sinon.match(instance.questionnaire.notificationBodyInProgress))
          .and(sinon.match(expectedLinkIntroduction))
          .and(sinon.match(expectedUrl));

        setupQuestionnaireInstance({ ...instance, status: 'in_progress' });

        await new SendScheduledNotificationsCronjob().execute();

        expect(sendMailStub).to.have.been.calledWith(
          expectedEmailAddress,
          sinon.match({
            subject: instance.questionnaire.notificationTitle,
            text: expectedContent,
            html: expectedContent,
          })
        );
      });

      it('should link to overview with a different text, when required by questionnaire settings', async () => {
        const instance = getQuestionnaireInstance9999996();
        const expectedUrl = '/extlink/questionnaires/user';
        const expectedLinkIntroduction =
          'Klicken Sie auf folgenden Link, um direkt zur Fragebogen-Übersicht zu gelangen:';
        const expectedContent = sinon.match.string
          .and(sinon.match(instance.questionnaire.notificationBodyNew))
          .and(sinon.match(expectedLinkIntroduction))
          .and(sinon.match(expectedUrl));

        setupQuestionnaireInstance({
          ...instance,
          status: 'active',
          questionnaire: {
            ...instance.questionnaire,
            notificationLinkToOverview: true,
          },
        });

        await new SendScheduledNotificationsCronjob().execute();

        expect(sendMailStub).to.have.been.calledWith(
          expectedEmailAddress,
          sinon.match({
            subject: instance.questionnaire.notificationTitle,
            text: expectedContent,
            html: expectedContent,
          })
        );
      });
    });
    describe('Sample notifications', () => {
      beforeEach(async () => {
        await focusOnNotificationType('sample');
      });

      it('should send a correct notification email for a sample notification', async () => {
        const expectedUrl = '/laboratory-results/LAB_RESULT-9999999999';
        const expectedContent = sinon.match.string
          .and(sinon.match('Liebe:r Nutzer:in,'))
          .and(
            sinon.match(
              'eine Ihrer Proben wurde analysiert. Klicken Sie auf folgenden Link, um direkt zum Laborbericht zu gelangen:'
            )
          )
          .and(sinon.match(expectedUrl));

        await new SendScheduledNotificationsCronjob().execute();

        expect(sendMailStub).to.have.been.calledWith(
          expectedEmailAddress,
          sinon.match({
            subject: 'PIA: Neuer Laborbericht!',
            text: expectedContent,
            html: expectedContent,
          })
        );
      });
    });
    describe('Questionnaire statistics', () => {
      beforeEach(async () => {
        await focusOnNotificationType('questionnaires_stats_aggregator');
        sendMailStub.resetHistory();
      });

      it('should send a correct notification email for a questionnaire statistics', async () => {
        await new SendScheduledNotificationsCronjob().execute();

        expect(sendMailStub).to.have.been.calledWith('test@example.local', {
          subject: 'Questionnaire stats aggregator',
          text: 'Statistics for\na questionnaire',
          html: 'Statistics for<br>a questionnaire',
        });
      });
    });
  });
});

async function clearFcmTokens(): Promise<void> {
  await db.none('DELETE FROM fcm_tokens');
}

async function focusOnNotificationType(
  type: NotificationType | null
): Promise<void> {
  if (type === null) {
    await db.none('DELETE FROM notification_schedules');
  } else {
    await db.none(
      'DELETE FROM notification_schedules WHERE notification_type != $1',
      [type]
    );
  }
}

async function getNotificationSchedule(
  referenceId: number
): Promise<DbNotificationSchedules | null> {
  return db.oneOrNone<DbNotificationSchedules>(
    'SELECT * FROM notification_schedules WHERE reference_id = $1',
    [referenceId.toString()]
  );
}

function setupQuestionnaireInstance(instance: QuestionnaireInstance): void {
  fetchMock.get(
    `express:/questionnaire/questionnaireInstances/${instance.id}`,
    {
      body: instance,
    }
  );
}

function setupParticipantEmailAddress(
  pseudonym: string,
  emailAddress: string
): void {
  fetchMock.get(`express:/personal/personalData/proband/${pseudonym}/email`, {
    body: emailAddress,
  });
}

function getQuestionnaireInstance9999996(): QuestionnaireInstance {
  return {
    id: 9999996,
    studyId: 'ApiTestStudie',
    questionnaireName: 'ApiTestQuestionnaire',
    pseudonym: 'qtest-proband1',
    dateOfIssue: new Date('2017-08-08T00:00:00.000Z'),
    dateOfReleaseV1: null,
    dateOfReleaseV2: null,
    cycle: 1,
    status: 'active',
    notificationsScheduled: null,
    releaseVersion: null,
    progress: 0,
    questionnaire: {
      id: 99999,
      studyId: 'ApiTestStudie',
      name: 'ApiTestQuestionnaire',
      version: 1,
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
      notificationLinkToOverview: false,
      activateAtDate: null,
      complianceNeeded: true,
      notifyWhenNotFilled: true,
      notifyWhenNotFilledTime: '00:00',
      notifyWhenNotFilledDay: 0,
      questions: [{}],
    } as unknown as Questionnaire,
  };
}

function getFirebaseMessagingError(code: string): FirebaseError {
  return {
    code,
    message: 'expected message',
  } as unknown as FirebaseError;
}
