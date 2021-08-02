/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const postgresqlHelper = require('../services/postgresqlHelper');
const pwHashesHelper = require('../helpers/pwHashesHelper.js');
const pgp = require('pg-promise')();

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
    pwHashesHelper.createHashedPasswordWithSaltAndPepper(password);

  const user = {
    username,
    password: passwordHash,
    salt,
    role,
    study_accesses: [],
    account_status: 'active',
  };
  await postgresqlHelper.createUser(user);
  // set pwChangeNeeded to false
  await postgresqlHelper.updateUserPasswordOnChangeReq(
    passwordHash,
    salt,
    false,
    username
  );
  console.info(`created user '${username}' with role '${role}'`);

  pgp.end();
})().catch((err) => {
  console.error('Could not create user:', err);
  process.exit(1);
});
