/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import StatusCodes from 'http-status-codes';
import { config } from '../../src/config';
import { Server } from '../../src/server';
import { getRepository } from 'typeorm';
import { AllowedIp } from '../../src/entities/allowedIps';
import { Account } from '../../src/entities/account';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const forscherLogin = {
  logged_in_with: 'web',
  username: 'QTestForscher1',
  password: 'Testpasswort',
  locale: 'de-DE',
};

describe('login with 2FA', () => {
  const originalIpCheck = config.ipCheckEnabled;
  const originalCertCheck = config.certCheckEnabled;

  before(async () => {
    config.ipCheckEnabled = true;
    config.certCheckEnabled = true;
    await Server.init();
    await getRepository(AllowedIp).insert({
      ip: '123.456.789.000',
      allowedRole: 'Forscher',
    });
    await getRepository(Account).insert({
      username: 'QTestForscher1',
      password:
        'dafb7a7b4ae61f8c9dc76945f7e8f697256fdfa5a409ad059ec91c9b24cd6a7c404b5b1d8a88fea9faa32650c1e1baf4f750967ae0f8da92699c46dd7002f1f1eb9dda46f6555a304da1c0da5a7f0d81fcdaa39e1122862c2ae01cf5ce18b9aaf2ddb9021f2cba149eed0e73c130a8c464f9619bdfa6a3b778186ebc61707bf3',
      role: 'Forscher',
    });
  });

  after(async () => {
    await Server.stop();
    await getRepository(AllowedIp).delete({ ip: '123.456.789.000' });
    await getRepository(Account).delete({ username: 'QTestForscher1' });
    config.ipCheckEnabled = originalIpCheck;
    config.certCheckEnabled = originalCertCheck;
  });

  it('should login with cert header', async () => {
    const result = await chai
      .request(apiAddress)
      .post('/user/login')
      .send(forscherLogin)
      .set({
        'x-ssl-client-dn':
          '/C=DE/ST=Niedersachsen/L=Braunschweig/O=HZI/OU=Forscherteam/CN=TESTPIA',
        'x-client-certificate-used': '1',
        'x-client-certificate-validated': '0',
      });
    expect(result).to.have.status(StatusCodes.OK);
  });

  it('should login with ip but wrong cert', async () => {
    const result = await chai
      .request(apiAddress)
      .post('/user/login')
      .send(forscherLogin)
      .set({
        'x-forwarded-for': '123.456.789.000',
        'x-ssl-client-dn':
          '/C=DE/ST=Niedersachsen/L=Braunschweig/O=HZI/OU=Forscherteam/CN=TESTPIA',
        'x-client-certificate-used': '1',
        'x-client-certificate-validated': '1',
      });
    expect(result).to.have.status(StatusCodes.OK);
  });

  it('should not login with wrong ip and no cert', async () => {
    const result = await chai
      .request(apiAddress)
      .post('/user/login')
      .send(forscherLogin)
      .set({
        'x-forwarded-for': '123.456.789.001',
      });
    expect(result).to.have.status(StatusCodes.FORBIDDEN);
  });
});
