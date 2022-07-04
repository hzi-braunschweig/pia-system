/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export enum DeletionType {
  FULL = 'full', // deletes all user data
  CONTACT = 'contact', // deletes only contact data, keeps study data
}
