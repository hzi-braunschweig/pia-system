const schedule = require('node-schedule');
const startOfToday = require('date-fns/startOfToday');
const addDays = require('date-fns/addDays');
const addHours = require('date-fns/addHours');
const addMinutes = require('date-fns/addMinutes');
const subDays = require('date-fns/subDays');
const format = require('date-fns/format');
const set = require('date-fns/set');

const postgresqlHelper = require('./postgresqlHelper.js');
const fcmHelper = require('./fcmHelper.js');
const mailService = require('./mailService.js');
const { config } = require('../config');
const personaldataserviceClient = require('../clients/personaldataserviceClient');

const defaultUserNotificationTime = '15:00';

/**
 * @description helper methods to send notifications
 */

const notificationHelper = (function () {
  function scheduleInstanceNotificationCreation() {
    // Once every hour at the fifth minute
    const rule = new schedule.RecurrenceRule();
    rule.minute = 5;

    return schedule.scheduleJob(
      rule,
      function () {
        this.checkAndScheduleNotifications();
      }.bind(this)
    );
  }

  function scheduleNotificationSending() {
    // Every 10 minutes
    const rule = new schedule.RecurrenceRule();
    rule.minute = new schedule.Range(0, 59, 10);

    return schedule.scheduleJob(
      rule,
      function () {
        this.sendAllOpenNotifications();
      }.bind(this)
    );
  }

  function scheduleDailySampleReportMails() {
    // Once a day at 4 am
    const rule = new schedule.RecurrenceRule();
    rule.hour = 4;
    rule.minute = 0;

    return schedule.scheduleJob(
      rule,
      function () {
        this.sendSampleReportMails();
      }.bind(this)
    );
  }

  async function sendSampleReportMails() {
    const studiesPM = await postgresqlHelper.getStudiesWithPMEmail();
    const studiesHUB = await postgresqlHelper.getStudiesWithHUBEmail();

    studiesPM.forEach(async (study) => {
      await sendSampleReportToPM(study);
    });

    studiesHUB.forEach(async (study) => {
      await sendSampleReportToHUB(study);
    });
  }

  async function sendSampleReportToPM(study) {
    const labResults = await postgresqlHelper.getNewSampledSamplesForStudy(
      study.name
    );
    console.log(
      'found ' +
        labResults.length +
        ' sampled labresults from yesterday in study ' +
        study.name +
        ', which the PM will be informed about'
    );
    if (labResults.length > 0) {
      const sampleReportMail = {
        subject: 'PIA – neue Proben sind auf dem Weg ins Labor!',
        text:
          'Gestern wurden ' +
          labResults.length +
          ' Proben in ' +
          study.name +
          ' erhoben. Sie sind auf dem Weg ins Labor und kommen bald an!',
        html:
          'Gestern wurden <br><h3>' +
          labResults.length +
          '</h3><br> Proben in ' +
          study.name +
          ' erhoben. Sie sind auf dem Weg ins Labor und kommen bald an!',
      };
      mailService.sendMail(study.pm_email, sampleReportMail);
    }
  }

  async function sendSampleReportToHUB(study) {
    const labResults = await postgresqlHelper.getNewAnalyzedSamplesForStudy(
      study.name
    );
    if (labResults.length > 0) {
      console.log(
        'found ' +
          labResults.length +
          ' analyzed labresults from yesterday in study ' +
          study.name +
          ', which the hub will be informed about'
      );
      const analyzedDate = format(subDays(startOfToday(), 1), 'dd.MM.yy');
      const participantCount = new Set(
        labResults.map((result) => {
          return result.user_id;
        })
      ).size;
      let mailText =
        'Datum der Analyse an der MHH: ' +
        analyzedDate +
        '\n' +
        'Anzahl der Teilnehmenden: ' +
        participantCount +
        '\n' +
        'Proben:\n';
      let mailHtml =
        'Datum der Analyse an der MHH: ' +
        analyzedDate +
        '<br>' +
        'Anzahl der TeilnehmerInnen: ' +
        participantCount +
        '<br>' +
        'Proben:<br>';
      labResults.forEach((result) => {
        mailText += result.id + ', ';
        mailHtml += result.id + ', ';
        if (result.dummy_sample_id) {
          mailText += result.dummy_sample_id + ', ';
          mailHtml += result.dummy_sample_id + ', ';
        }
      });
      const sampleReportMail = {
        subject: 'ZIFCO',
        text: mailText,
        html: mailHtml,
      };
      mailService.sendMail(study.hub_email, sampleReportMail);
    } else {
      console.log(
        'found no new labresults in study: ' +
          study.name +
          ', sending no email to hub'
      );
    }
  }

  async function checkAndScheduleNotifications() {
    console.log('Starting check and schedule for questionnaire instances');
    const qInstancesResult =
      await postgresqlHelper.getActiveQuestionnaireInstances();
    console.log('Found potential qIs: ' + qInstancesResult.length);

    for (const qInstance of qInstancesResult) {
      const userSettings = await postgresqlHelper.getUserNotificationSettings(
        qInstance.user_id
      );
      const questionnaireSettings =
        await postgresqlHelper.getQuestionnaireNotificationSettings(
          qInstance.questionnaire_id,
          qInstance.questionnaire_version
        );

      if (questionnaireSettings.cycle_unit !== 'spontan') {
        const sendDates = createDatesForUserNotification(
          userSettings,
          questionnaireSettings,
          qInstance.date_of_issue
        );
        await postgresqlHelper.markInstanceAsScheduled(qInstance.id);
        sendDates.forEach((date) => {
          createNotification(
            date,
            qInstance.user_id,
            'qReminder',
            qInstance.id
          );
        });
      }
    }
  }

  function createDatesForUserNotification(
    userSettings,
    questionnaireSettings,
    date_of_issue
  ) {
    const sendDates = [];

    const notification_interval_unit =
      questionnaireSettings.notification_interval_unit
        ? questionnaireSettings.notification_interval_unit
        : 'days';
    const notification_interval = questionnaireSettings.notification_interval
      ? questionnaireSettings.notification_interval
      : 1;

    userSettings.notification_time = userSettings.notification_time
      ? userSettings.notification_time
      : defaultUserNotificationTime;
    const timeSplit = userSettings.notification_time.split(':');
    const userSettingsHour = parseInt(timeSplit[0], 10);
    const userSettingsMinute = parseInt(timeSplit[1], 10);

    for (let i = 0; i < questionnaireSettings.notification_tries; i++) {
      const userSettingsTime = set(new Date(), {
        hours: userSettingsHour,
        minutes: userSettingsMinute,
      });
      let newDate = null;

      // Use instance date as reference
      if (questionnaireSettings.cycle_unit === 'hour') {
        newDate =
          notification_interval_unit === 'days'
            ? addDays(new Date(date_of_issue), i * notification_interval)
            : addHours(new Date(date_of_issue), i * notification_interval);
      }
      // Use user settings as reference
      else if (notification_interval_unit === 'days') {
        newDate = addDays(userSettingsTime, i * notification_interval);
      } else if (notification_interval_unit === 'hours') {
        newDate = addHours(userSettingsTime, i * notification_interval);
      }

      if (newDate) sendDates.push(newDate);
    }

    return sendDates;
  }

  async function createNotification(date, user_id, type, reference_id) {
    const schedule = [user_id, date, type, reference_id];
    await postgresqlHelper.insertNotificationSchedule(schedule);
  }

  async function createCustomNotification(
    date,
    user_id,
    reference_id,
    title,
    body
  ) {
    const schedule = [user_id, date, 'custom', reference_id, title, body];
    return await postgresqlHelper.insertCustomNotificationSchedule(schedule);
  }

  async function createNotableAnswerNotification(email, date, title, body) {
    const schedule = [
      null,
      date,
      'questionnaires_stats_aggregator',
      email,
      title,
      body,
    ];
    return await postgresqlHelper.insertCustomNotificationSchedule(schedule);
  }

  async function handleUpdatedLabResult(r_old, r_new) {
    if (r_old.status !== 'analyzed' && r_new.status === 'analyzed') {
      const userSettings = await postgresqlHelper.getUserNotificationSettings(
        r_new.user_id
      );
      if (userSettings.compliance_labresults) {
        userSettings.notification_time = userSettings.notification_time
          ? userSettings.notification_time
          : defaultUserNotificationTime;
        const timeSplit = userSettings.notification_time.split(':');
        const userSettingsHour = parseInt(timeSplit[0], 10);
        const userSettingsMinute = parseInt(timeSplit[1], 10);

        const sendDate = set(new Date(), {
          hours: userSettingsHour,
          minutes: userSettingsMinute,
        });
        console.log(
          'New labresult was analysed, scheduling notification to: ' +
            r_new.user_id +
            ' at: ' +
            sendDate
        );
        await createNotification(sendDate, r_new.user_id, 'sample', r_new.id);
      }
    }
  }

  async function handleUpdatedUser(r_old, r_new) {
    if (
      r_old.notification_time !== r_new.notification_time &&
      r_new.notification_time
    ) {
      const schedules = await postgresqlHelper.getAllNotificationsForUser(
        r_new.username
      );

      const timeSplitOld = r_old.notification_time
        ? r_old.notification_time.split(':')
        : defaultUserNotificationTime.split(':');
      const userSettingsHourOld = parseInt(timeSplitOld[0], 10);
      const userSettingsMinuteOld = parseInt(timeSplitOld[1], 10);

      const timeSplitNew = r_new.notification_time.split(':');
      const userSettingsHourNew = parseInt(timeSplitNew[0], 10);
      const userSettingsMinuteNew = parseInt(timeSplitNew[1], 10);

      const hourDiv = userSettingsHourNew - userSettingsHourOld;
      const minuteDiv = userSettingsMinuteNew - userSettingsMinuteOld;

      schedules.forEach(async (schedule) => {
        const newDate = addHours(
          addMinutes(new Date(schedule.send_on), minuteDiv),
          hourDiv
        );
        await postgresqlHelper.updateTimeForNotification(schedule.id, newDate);
      });
      console.log(
        'changed time of ' + schedules.length + ' notification schedules'
      );
    }
  }

  async function questionnaireInstanceHasNotableAnswers(
    questionnaireInstanceId
  ) {
    const hasAnswersNotifyFeature =
      await postgresqlHelper.hasAnswersNotifyFeature(questionnaireInstanceId);
    if (hasAnswersNotifyFeature) {
      const answers = await postgresqlHelper.getQuestionnaireInstanceAnswers(
        questionnaireInstanceId
      );
      for (let i = 0; i < answers.length; i++) {
        const isNotableAnswer = await postgresqlHelper.isNotableAnswer(
          answers[i].answer_option_id,
          answers[i].value
        );
        if (isNotableAnswer) {
          await postgresqlHelper.insertContactProbandRecordForNotableAnswer(
            questionnaireInstanceId
          );
          break;
        }
      }
    }
  }

  async function sendAllOpenNotifications() {
    const scheduledNotifications =
      await postgresqlHelper.getAllDueNotifications();
    console.log(
      'Found ' + scheduledNotifications.length + ' scheduled notifications'
    );
    scheduledNotifications.forEach((schedule) => {
      if (schedule.notification_type === 'qReminder') {
        try {
          sendInstanceNotification(schedule);
        } catch (e) {
          console.log(e);
        }
      } else if (schedule.notification_type === 'sample') {
        try {
          sendSampleNotification(schedule);
        } catch (e) {
          console.log(e);
        }
      } else if (schedule.notification_type === 'custom') {
        try {
          processScheduledCustomNotification(schedule);
        } catch (e) {
          console.log(e);
        }
      } else if (
        schedule.notification_type === 'questionnaires_stats_aggregator'
      ) {
        try {
          sendQuestionnairesStatsAggregatorNotification(schedule);
        } catch (e) {
          console.log(e);
        }
      }
    });
  }

  async function sendInstanceNotification(schedule) {
    try {
      const qInstance = await postgresqlHelper.getQuestionnaireInstance(
        schedule.reference_id
      );
      const questionnaire = qInstance
        ? await postgresqlHelper.getFilteredQuestionnaireForInstance(qInstance)
        : null;

      if (!qInstance) {
        console.log(
          'The questionnaire instance of that notification schedule is no longer present, deleting schedule for instance: ' +
            schedule.reference_id
        );
        await postgresqlHelper.deleteScheduledNotificationByInstanceId(
          schedule.reference_id
        );
      } else if (!questionnaire) {
        console.log(
          'The questionnaire of that notification schedule is empty because of conditions, postponing schedule for instance: ' +
            schedule.reference_id
        );
        await postgresqlHelper.postponeNotificationByInstanceId(
          schedule.reference_id
        );
      } else if (
        qInstance.status === 'active' ||
        qInstance.status === 'in_progress'
      ) {
        const userStatus = await postgresqlHelper.getTokenAndDeviceForUser(
          schedule.user_id
        );
        let sendMail = false;
        let sendNotification = false;
        if (userStatus.fcm_token && userStatus.logged_in_with)
          sendNotification = true;
        if (
          userStatus.logged_in_with === 'web' ||
          userStatus.first_logged_in_at === null
        )
          sendMail = true;

        let notification_body = '';
        const notification_title = questionnaire.notification_title;

        if (qInstance.status === 'active') {
          notification_body = questionnaire.notification_body_new;
        } else {
          notification_body = questionnaire.notification_body_in_progress;
        }

        let didSendReminder = false;
        try {
          if (sendNotification) {
            let numberOfOpenQuestionnairesForBadge;
            try {
              if (userStatus.logged_in_with === 'ios') {
                numberOfOpenQuestionnairesForBadge =
                  postgresqlHelper.countOpenQuestionnaireInstances(
                    schedule.user_id
                  );
              }
            } catch (e) {
              console.log('Could not fetch QI count', e);
            }
            console.log(
              'Sending notification to user: ' +
                qInstance.user_id +
                ' for instance id: ' +
                qInstance.id +
                ' and device: ' +
                userStatus.logged_in_with
            );

            // Send notification with default text
            const result = await fcmHelper.sendDefaultNotification(
              userStatus.fcm_token,
              schedule.id,
              userStatus.logged_in_with,
              numberOfOpenQuestionnairesForBadge
            );

            if (result && result.error) {
              console.log(
                'Could not send notification to user: ' +
                  qInstance.user_id +
                  ' for instance id: ' +
                  qInstance.id +
                  ' and device: ' +
                  userStatus.logged_in_with
              );
              console.log(result.error);
            } else {
              console.log(
                'Successfully sent notification to user: ' +
                  qInstance.user_id +
                  ' for instance id: ' +
                  qInstance.id +
                  ' and device: ' +
                  userStatus.logged_in_with
              );
              didSendReminder = true;
              // Set date for notification schedule on null
              await postgresqlHelper.updateTimeForNotification(
                schedule.id,
                null
              );
            }
          }
          if (sendMail) {
            console.log(
              'Sending email to user: ' +
                qInstance.user_id +
                ' for instance id: ' +
                qInstance.id
            );

            const email = await personaldataserviceClient
              .getPersonalDataEmail(qInstance.user_id)
              .catch(() => {
                console.log('User has no email address');
                return null;
              });

            if (email) {
              const InstanceReminderMail = {
                subject: notification_title,
                text:
                  'Liebe:r Nutzer:in,\n\n' +
                  notification_body +
                  '\nKlicken Sie auf folgenden Link, um direkt zum Fragebogen zu gelangen:\n' +
                  '<a href="' +
                  config.webappUrl +
                  '/extlink/questionnaire/' +
                  qInstance.questionnaire_id +
                  '/' +
                  qInstance.id +
                  '">PIA Webapp</a>',
                html:
                  'Liebe:r Nutzer:in,<br><br>' +
                  notification_body +
                  '<br>Klicken Sie auf folgenden Link, um direkt zum Fragebogen zu gelangen:<br>' +
                  '<a href="' +
                  config.webappUrl +
                  '/extlink/questionnaire/' +
                  qInstance.questionnaire_id +
                  '/' +
                  qInstance.id +
                  '">PIA Webapp</a>',
              };
              await mailService.sendMail(email, InstanceReminderMail);
              console.log(
                'Successfully sent email to user: ' +
                  qInstance.user_id +
                  ' for instance id: ' +
                  qInstance.id
              );
              await postgresqlHelper.deleteScheduledNotification(schedule.id);
              didSendReminder = true;
            }
          }
        } catch (e) {
          console.log(e);
        }

        if (!didSendReminder) {
          console.log(
            'Error sending notification AND email to user: ' +
              qInstance.user_id +
              ' for instance id: ' +
              qInstance.id,
            ', postponing it'
          );
          await postgresqlHelper.postponeNotificationByInstanceId(
            schedule.reference_id
          );
        }
      } else if (
        qInstance.status === 'released_once' ||
        qInstance.status === 'released_twice' ||
        qInstance.status === 'expired'
      ) {
        console.log(
          'The questionnaire instance of that notification schedule hase been released or is expired, deleting schedule for instance: ' +
            schedule.reference_id
        );
        await postgresqlHelper.deleteScheduledNotificationByInstanceId(
          schedule.reference_id
        );
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function sendSampleNotification(schedule) {
    const labResult = await postgresqlHelper.getLabResult(
      schedule.reference_id
    );
    const userStatus = await postgresqlHelper.getTokenAndDeviceForUser(
      schedule.user_id
    );

    let sendMail = false;
    let sendNotification = false;
    if (userStatus.fcm_token && userStatus.logged_in_with)
      sendNotification = true;
    if (userStatus.logged_in_with === 'web') sendMail = true;

    let didSendReminder = false;
    try {
      if (sendNotification) {
        console.log(
          'Sending notification to user: ' +
            schedule.user_id +
            ' for sample id: ' +
            labResult.id +
            ' and device: ' +
            userStatus.logged_in_with
        );

        // Send notification with default text
        const result = await fcmHelper.sendDefaultNotification(
          userStatus.fcm_token,
          schedule.id,
          userStatus.logged_in_with
        );
        if (result && result.error) {
          console.log(
            'Could not send notification to user: ' +
              schedule.user_id +
              ' for sample id: ' +
              labResult.id +
              ' and device: ' +
              userStatus.logged_in_with
          );
          console.log(result.error);
        } else {
          console.log(
            'Successfully sent notification to user: ' +
              schedule.user_id +
              ' for sample id: ' +
              labResult.id +
              ' and device: ' +
              userStatus.logged_in_with
          );
          didSendReminder = true;
          // Set date for notification schedule to null
          await postgresqlHelper.updateTimeForNotification(schedule.id, null);
        }
      }
      if (sendMail) {
        console.log(
          'Sending labresult email for: ' +
            schedule.reference_id +
            ' to: ' +
            schedule.user_id
        );

        const email = await personaldataserviceClient
          .getPersonalDataEmail(schedule.user_id)
          .catch(() => {
            console.log('User has no email address');
            return null;
          });

        if (email) {
          const InstanceReminderMail = {
            subject: 'PIA: Neuer Laborbericht!',
            text:
              'Liebe:r Nutzer:in,\n\n' +
              'eine Ihrer Proben wurde analysiert. Klicken Sie auf folgenden Link, um direkt zum Laborbericht zu gelangen:\n' +
              '<a href="' +
              config.webappUrl +
              '/laboratory-results/' +
              labResult.id +
              '">PIA Webapp</a>',
            html:
              'Liebe:r Nutzer:in,<br><br>' +
              'eine Ihrer Proben wurde analysiert. Klicken Sie auf folgenden Link, um direkt zum Laborbericht zu gelangen:<br>' +
              '<a href="' +
              config.webappUrl +
              '/laboratory-results/' +
              labResult.id +
              '">PIA Webapp</a>',
          };
          await mailService.sendMail(email, InstanceReminderMail);
          console.log(
            'Successfully sent email to user: ' +
              schedule.user_id +
              ' for sample id: ' +
              schedule.reference_id
          );
          await postgresqlHelper.deleteScheduledNotification(schedule.id);
          didSendReminder = true;
        }
      }
    } catch (e) {
      console.log(e);
    }
    if (!didSendReminder) {
      console.log(
        'Error sending notification AND email to user: ' +
          schedule.user_id +
          ' for sample id: ' +
          schedule.reference_id,
        ', postponing it'
      );
      await postgresqlHelper.postponeNotification(schedule.id);
    }
  }

  async function sendQuestionnairesStatsAggregatorNotification(schedule) {
    console.log(
      'Sending questionnaires_stats_aggregator notification with id ' +
        schedule.id
    );
    try {
      const emailTo = schedule.reference_id;
      if (emailTo) {
        const emailPayload = {
          subject: schedule.title,
          text: schedule.body,
          html: schedule.body.replace(/(?:\r\n|\r|\n)/g, '<br>'),
        };
        await mailService.sendMail(emailTo, emailPayload);
        console.log('Successfully sent email to: ' + emailTo);
        await postgresqlHelper.deleteScheduledNotification(schedule.id);
      } else {
        console.log('user has no email address');
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function processScheduledCustomNotification(schedule) {
    const tokenResult = await postgresqlHelper.getTokenAndDeviceForUser(
      schedule.user_id
    );
    let sendNotification = false;
    if (tokenResult.fcm_token && tokenResult.logged_in_with)
      sendNotification = true;

    try {
      if (sendNotification) {
        console.log(
          'Sending custom notification for schedule: ' +
            schedule.id +
            ' to user: ' +
            schedule.user_id
        );

        const result = await fcmHelper.sendDefaultNotification(
          tokenResult.fcm_token,
          schedule.id,
          tokenResult.logged_in_with
        );

        if (result && result.error) {
          console.log(
            'Could not send custom notification to user: ' +
              schedule.user_id +
              ', postponing it'
          );
          await postgresqlHelper.postponeNotificationByOneHour(schedule.id);
        } else {
          console.log(
            'Successfully sent custom notification to user: ' + schedule.user_id
          );
          await postgresqlHelper.updateTimeForNotification(schedule.id, null);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  return {
    /**
     * @function
     * @description schedules the hourly notification creation
     * @memberof module:notificationHelper
     */
    scheduleInstanceNotificationCreation: scheduleInstanceNotificationCreation,

    /**
     * @function
     * @description schedules the daily sample report
     * @memberof module:notificationHelper
     */
    scheduleDailySampleReportMails: scheduleDailySampleReportMails,

    /**
     * @function
     * @description sends a mail to PM about new samples
     * @memberof module:notificationHelper
     */
    sendSampleReportMails: sendSampleReportMails,

    /**
     * @function
     * @description schedules the sending of notifications every 10 minutes
     * @memberof module:notificationHelper
     */
    scheduleNotificationSending: scheduleNotificationSending,

    /**
     * @function
     * @description processes a scheduled notification
     * @memberof module:notificationHelper
     */
    processScheduledCustomNotification: processScheduledCustomNotification,

    /**
     * @function
     * @description sends all due notifications
     * @memberof module:notificationHelper
     */
    sendAllOpenNotifications: sendAllOpenNotifications,

    /**
     * @function
     * @description checks which notifications are to be send and schedules them
     * @memberof module:notificationHelper
     */
    checkAndScheduleNotifications: checkAndScheduleNotifications,

    /**
     * @function
     * @description creates dates for push notifications
     * @memberof module:notificationHelper
     * @param {object} userSettings the user settings
     * @param {object} questionnaireSettings the questionnaire settings
     */
    createDatesForUserNotification: createDatesForUserNotification,

    /**
     * @function
     * @description creates a custom a schedule for a custom notification
     * @memberof module:notificationHelper
     */
    createCustomNotification: createCustomNotification,

    /**
     * @function
     * @description creates a custom a schedule for a notable answer notification
     * @memberof module:notificationHelper
     */
    createNotableAnswerNotification: createNotableAnswerNotification,

    /**
     * @function
     * @description handles updates to a lab result
     * @memberof module:notificationHelper
     * @param {object} r_old the old lab_result
     * @param {object} r_new the new lab_result
     */
    handleUpdatedLabResult: handleUpdatedLabResult,

    /**
     * @function
     * @description handles updates to a users notification time settings
     * @memberof module:notificationHelper
     * @param {object} r_old the old user
     * @param {object} r_new the new user
     */
    handleUpdatedUser: handleUpdatedUser,

    /**
     * @function
     * @description handles updates to a questionnaire instance answer
     * @memberof module:notificationHelper
     * @param {integer} questionnaireInstanceId the questionnaire instance id
     */
    questionnaireInstanceHasNotableAnswers:
      questionnaireInstanceHasNotableAnswers,
  };
})();

module.exports = notificationHelper;
