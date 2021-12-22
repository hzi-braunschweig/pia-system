/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { connectDatabase } = require('../db');
const { getRepository, getConnection } = require('typeorm');
const { Account } = require('../entities/account');
const { PwHashesHelper } = require('../helpers/pwHashesHelper');

function getArg(prefix) {
  for (const arg of process.argv) {
    if (arg.startsWith(prefix)) {
      return arg.substr(prefix.length);
    }
  }
}

(async () => {
  const username = getArg('--user=');
  const password = getArg('--password=');
  const role = getArg('--role=') || 'SysAdmin';

  if (!username || !password) {
    console.error('--user=$USER --password=$PASSWORD are required');
    process.exit(1);
  }

  const { salt, passwordHash } =
    PwHashesHelper.createHashedPasswordWithSaltAndPepper(password);

  await connectDatabase();

  const repo = getRepository(Account);

  await repo.insert({
    username: username,
    role: role,
    password: passwordHash,
    salt: salt,
    pwChangeNeeded: false,
    accountStatus: 'account',
    status: 'deactivated', // Proband-Status is not relevant for professional users
  });

  await getConnection().close();
  console.info(`created user '${username}' with role '${role}'`);
})().catch((err) => {
  console.error('Could not create user:', err);
  process.exit(1);
});
