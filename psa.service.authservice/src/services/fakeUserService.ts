/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { BasicAccount } from '../entities/account';

/**
 * @description in-memory storage of non-existing, i.e. fake, users to prohibit repeated login attempts
 */

const LRU_MAX = 1000;
const LRU: string[] = []; // List of last fake user names
const fakeUsers = new Map<string, BasicAccount>(); // Fake users data, indexed by user name

/**
 * puts data object for fake user into storage
 * @param userName
 * @param data
 */
export function put(userName: string, data: BasicAccount): void {
  const lruPos = LRU.indexOf(userName);
  if (lruPos >= 0) {
    LRU.splice(lruPos, 1);
  } else if (LRU.length >= LRU_MAX) {
    const deleted = LRU.shift();
    deleted && fakeUsers.delete(deleted);
  }
  LRU.push(userName);
  fakeUsers.set(userName, data);
}

/**
 * gets data object for fake user from storage
 * @param userName
 */
export function get(userName: string): BasicAccount {
  const fakeUser = fakeUsers.get(userName);
  if (fakeUser) {
    return fakeUser;
  }
  return {
    username: userName,
    role: 'Proband',
    thirdWrongPasswordAt: null,
    numberOfWrongAttempts: 0,
  };
}
