/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

importScripts(
  'https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js'
);

// Initialize Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyDf4H-r-iDYG1lVtlDQXs2xJTmvDT4lzV0',
  authDomain: 'pia-app-c50e8.firebaseapp.com',
  projectId: 'pia-app-c50e8',
  storageBucket: 'pia-app-c50e8.appspot.com',
  messagingSenderId: '1012552142126',
  appId: '1:1012552142126:web:1cdd40ece476ebfea83ebf',
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message',
    payload
  );

  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/images/pia_logo.png',
    requireInteraction: true,
    data: payload.data,
  };

  self.registration.showNotification(
    payload.notification.title,
    notificationOptions
  );
});

self.addEventListener('notificationclick', function (event) {
  const promiseChain = clients.openWindow(
    '/home?notification_id=' + event.notification.data.id
  );
  event.waitUntil(promiseChain);
});
