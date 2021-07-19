const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const sinon = require('sinon');
const addMinutes = require('date-fns/addMinutes');
const startOfToday = require('date-fns/startOfToday');
const CronTime = require('cron').CronTime;

const fcmHelper = require('../../src/services/fcmHelper');
const mailer = require('../../src/services/mailService');

const notificationHelper = require('../../src/services/notificationHelper');
const { dbWait, performAndWait } = require('./helper');

const { db } = require('../../src/db');

const { setup, cleanup } = require('./notification.spec.data/setup.helper');

const secretOrPrivateKey = require('../secretOrPrivateKey');
const server = require('../../src/server');

const JWT = require('jsonwebtoken');

const apiAddress = 'http://localhost:' + process.env.PORT + '/notification';

const serverSandbox = sinon.createSandbox();

const probandSession1 = { id: 1, role: 'Proband', username: 'QTestProband1' };
const probandSession2 = { id: 1, role: 'Proband', username: 'QTestProband2' };

const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher1',
};
const utSession = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'QTestUntersuchungsteam',
};
const pmSession = {
  id: 1,
  role: 'ProbandenManager',
  username: 'QTestProbandenManager',
};
const sysadminSession = {
  id: 1,
  role: 'SysAdmin',
  username: 'QTestSystemAdmin',
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

describe('/notification', function () {
  before(async function () {
    serverSandbox.stub(fcmHelper);
    serverSandbox.stub(mailer);
    await server.init();
  });

  after(async function () {
    await server.stop();
    serverSandbox.restore();
  });

  beforeEach(async function () {
    await setup();
  });

  afterEach(async function () {
    await cleanup();
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
    it('should update scheduled notification times if users table is updated', async function () {
      const scheduleBeforeUpdate = await db.one(
        'SELECT * FROM notification_schedules WHERE id=$1',
        [99997]
      );

      await dbWait(
        'UPDATE users SET logged_in_with=${logged_in_with}, notification_time=${notification_time} WHERE username=${username}',
        {
          logged_in_with: 'ios',
          username: 'QTestProband1',
          notification_time: '17:30:00',
        }
      );

      const scheduleAfterUpdate = await db.one(
        'SELECT * FROM notification_schedules WHERE id=$1',
        [99997]
      );
      const differenceInMinutes =
        ((scheduleAfterUpdate.send_on - scheduleBeforeUpdate.send_on) /
          (3600 * 1000)) *
        60;

      expect(differenceInMinutes).to.equal(150);
    });

    it('should update users_to_contact table if a notable answer is sent', async function () {
      await dbWait(
        'UPDATE questionnaire_instances SET status=${status} WHERE id=${id}',
        {
          status: 'released_once',
          id: 9999996,
        }
      );

      const userToContact = await db.one(
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
      const logSpy = sinon.spy(console, 'log');

      await performAndWait(
        async () => notificationHelper.sendAllOpenNotifications(),
        [
          'Successfully sent notification to user: QTestProband1 for sample id: LAB_RESULT-9999999999 and device: web',
          'Successfully sent custom notification to user: QTestProband1',
          'Successfully sent notification to user: QTestProband1 for instance id: 9999996 and device: web',
        ]
      );
      expect(
        logSpy.calledWith(
          'Successfully sent custom notification to user: QTestProband1'
        )
      ).equal(true);

      expect(
        logSpy.calledWith(
          'Successfully sent notification to user: QTestProband1 for sample id: LAB_RESULT-9999999999 and device: web'
        )
      ).equal(true);

      expect(
        logSpy.calledWith(
          'Successfully sent notification to user: QTestProband1 for instance id: 9999996 and device: web'
        )
      ).equal(true);

      logSpy.restore();
    });

    it('should send sample report mails', async function () {
      await db.none(
        "INSERT INTO lab_results VALUES ('LAB_RESULT-88888', 'QTestProband1', null, $1,'new','Das PM merkt an: bitte mit Vorsicht genießen!',false,'Dr. House',null)",
        [startOfToday()]
      );

      await db.none(
        "INSERT INTO lab_observations (lab_result_id, name_id, result_value, date_of_announcement) VALUES ('LAB_RESULT-88888', 0, '', $1)",
        [startOfToday()]
      );

      const logSpy = sinon.spy(console, 'log');

      await performAndWait(
        async () => notificationHelper.sendSampleReportMails(),
        [
          'Found 1 sampled labresults from yesterday in study ApiTestStudie, which the PM will be informed about',
          'Found 1 analyzed labresults from yesterday in study ApiTestStudie, which the hub will be informed about',
        ]
      );
      expect(
        logSpy.calledWith(
          'Found 1 sampled labresults from yesterday in study ApiTestStudie, which the PM will be informed about'
        )
      ).equal(true);

      expect(
        logSpy.calledWith(
          'Found 1 analyzed labresults from yesterday in study ApiTestStudie, which the hub will be informed about'
        )
      ).equal(true);

      logSpy.restore();
    });

    it('should check and schedule notifications', async function () {
      const logSpy = sinon.spy(console, 'log');

      await performAndWait(
        async () => notificationHelper.checkAndScheduleNotifications(),
        ['Found potential qIs: 2']
      );
      expect(logSpy.calledWith('Found potential qIs: 2')).equal(true);

      logSpy.restore();
    });

    it('should run questionnaire cron jobs', async function () {
      const jobs = server.checkForNotFilledQuestionnairesJobs();

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
