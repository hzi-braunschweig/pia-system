const Boom = require('@hapi/boom');
const isValid = require('date-fns/isValid');
const addHours = require('date-fns/addHours');

const postgresqlHelper = require('../services/postgresqlHelper.js');
const notificationHelper = require('../services/notificationHelper.js');
const fcmHelper = require('../services/fcmHelper.js');

/**
 * @description interactor that handles notification requests based on users permissions
 */
const notificationInteractor = (function () {
  async function createNotification(decodedToken, notification) {
    const failedSendTo = [];
    const notLoggedIn = [];
    const notificationDate = isValid(notification.date)
      ? new Date(notification.date)
      : addHours(new Date(), 1);

    if (decodedToken.role !== 'ProbandenManager') {
      return Boom.forbidden('Unknown or wrong role');
    }

    // Create notification for each recipient
    for (const recipient of notification.recipients) {
      const result = await postgresqlHelper
        .getTokenAndDeviceForUserIfAllowed(decodedToken.username, recipient)
        .catch(function () {
          failedSendTo.push(recipient);
        });
      if (result !== undefined && result.fcm_token && result.logged_in_with) {
        if (notification.date == null) {
          const customNotificationObj =
            await notificationHelper.createCustomNotification(
              null,
              recipient,
              '',
              notification.title,
              notification.body
            );
          const notifiactionResult = await fcmHelper.sendDefaultNotification(
            result.fcm_token,
            customNotificationObj.id.toString(),
            result.logged_in_with
          );

          if (notifiactionResult && notifiactionResult.error) {
            console.log(
              'Could not send custom notification to user: ' + recipient
            );
            console.log(notifiactionResult.error);
          } else {
            console.log(
              'Successfully sent custom notification to user: ' + recipient
            );
          }
        } else {
          await notificationHelper.createCustomNotification(
            notificationDate,
            recipient,
            '',
            notification.title,
            notification.body
          );
        }
      } else {
        if (!failedSendTo.includes(recipient)) {
          notLoggedIn.push(recipient);
          await notificationHelper.createCustomNotification(
            notificationDate,
            recipient,
            '',
            notification.title,
            notification.body
          );
        }
      }
    }

    return {
      success: notification.recipients.some(
        (recipient) =>
          !failedSendTo.includes(recipient) && !notLoggedIn.includes(recipient)
      ),
    };
  }

  async function getNotification(decodedToken, notification_id) {
    if (decodedToken.role !== 'Proband') {
      return Boom.notFound(
        'Could not get notification, because user role is not valid'
      );
    }

    const resultNotificationByID = await postgresqlHelper
      .getNotificationById(notification_id)
      .catch((err) => {
        console.error(err);
        return Boom.notFound(
          'Could not get notification, because it does not exist'
        );
      });

    if (decodedToken.username !== resultNotificationByID.user_id) {
      return Boom.notFound(
        'Could not get notification: User hast no right to see this notification'
      );
    }

    switch (resultNotificationByID.notification_type) {
      case 'qReminder': {
        const qInstance = await postgresqlHelper.getQuestionnaireInstance(
          resultNotificationByID.reference_id
        );
        if (!qInstance) {
          return Boom.notFound('Could not get questionnaire instance');
        }

        const questionnaire =
          await postgresqlHelper.getFilteredQuestionnaireForInstance(qInstance);
        if (!questionnaire) {
          return Boom.notFound('Could not get questionnaire');
        }

        let notification_body;
        if (qInstance.status === 'active') {
          notification_body = questionnaire.notification_body_new;
        } else {
          notification_body = questionnaire.notification_body_in_progress;
        }
        await postgresqlHelper.deleteScheduledNotification(notification_id);
        return {
          notification_type: resultNotificationByID.notification_type,
          reference_id: resultNotificationByID.reference_id,
          title: questionnaire.notification_title,
          body: notification_body,
          questionnaire_id: qInstance.questionnaire_id,
          questionnaire_version: qInstance.questionnaire_version,
        };
      }
      case 'sample': {
        await postgresqlHelper.deleteScheduledNotification(notification_id);
        return {
          notification_type: resultNotificationByID.notification_type,
          reference_id: resultNotificationByID.reference_id,
          title: 'Neuer Laborbericht!',
          body: 'Eine Ihrer Proben wurde analysiert, klicken Sie direkt auf diese Nachricht um das Ergebnis zu öffnen.',
        };
      }
      case 'custom': {
        await postgresqlHelper.deleteScheduledNotification(notification_id);
        return {
          notification_type: resultNotificationByID.notification_type,
          reference_id: resultNotificationByID.reference_id,
          title: resultNotificationByID.title,
          body: resultNotificationByID.body,
        };
      }
      default:
        return Boom.notFound('Got notification of unknown type');
    }
  }

  return {
    /**
     * @function
     * @description creates a new notification based on the users permissions
     * @memberof module:notificationInteractor
     * @param {string} userToken the jwt of the request
     * @param {string} notification the fcm notification to create
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    createNotification: createNotification,

    /**
     * @function
     * @description get notification with id
     * @memberof module:notificationInteractor
     * @param {string} userToken the jwt of the request
     * @param {string} notification_id the fcm notification id
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getNotification: getNotification,
  };
})();

module.exports = notificationInteractor;
