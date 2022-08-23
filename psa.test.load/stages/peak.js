/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * This stages configuration will simulate peak user activity, increasing over
 * 6 minutes, ramping up from 200 users to 2000, based on current studies and
 * their projected participants.
 */

export default [
  { duration: '2s', target: 1 }, // start
  { duration: '2m', target: 200 }, // ramp up
  { duration: '2m', target: 200 }, // stay
  { duration: '2m', target: 1000 }, // ramp up
  { duration: '2m', target: 1000 }, // stay
  { duration: '5m', target: 2000 }, // ramp up
  { duration: '2m', target: 2000 }, // stay
  { duration: '1m', target: 0 }, // ramp down
];
