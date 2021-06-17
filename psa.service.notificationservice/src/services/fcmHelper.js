const fbAdmin = require('firebase-admin');

const { config } = require('../config');

/**
 * @description helper methods to access db
 */
const fcmHelper = (function () {
  function initFBAdmin() {
    const credential = config.fireBaseCredentials;
    fbAdmin.initializeApp({
      credential: fbAdmin.credential.cert(credential),
      projectId: credential.project_id,
    });
  }

  async function sendDefaultNotification(
    fcmToken,
    notification_id,
    device_type,
    badgeNumber
  ) {
    const default_title = 'PIA - Sie haben eine neue Nachricht.';
    const default_body =
      'Bitte tippen Sie auf diese Meldung, um Sie anzuzeigen.';

    const payload = {
      notification: {
        title: default_title,
        body: default_body,
      },
      data: {
        id: notification_id.toString(),
        title: default_title,
        body: default_body,
        notification_foreground: 'true',
      },
    };
    if (typeof badgeNumber === 'number') {
      payload.notification.badge = String(badgeNumber);
    }

    try {
      const result = await fbAdmin.messaging().sendToDevice(fcmToken, payload);

      if (result && result.failureCount > 0) {
        return { error: result.results };
      } else {
        return result;
      }
    } catch (err) {
      return { error: err };
    }
  }

  return {
    /**
     * @function
     * @description initializes the firebase-admin adk with the fb projects and acc
     * @memberof module:fcmHelper
     */
    initFBAdmin: initFBAdmin,

    /**
     * @function
     * @description sends a default fcm message to one user
     * @param {string} fcmToken the token of the user to send the message to
     * @param {object} notification_id the notification id to send
     * @memberof module:fcmHelper
     */
    sendDefaultNotification: sendDefaultNotification,
  };
})();

module.exports = fcmHelper;
