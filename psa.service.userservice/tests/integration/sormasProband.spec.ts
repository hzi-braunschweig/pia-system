import chai from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from 'sinon-chai';
import JWT from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import sinon, { SinonSpy } from 'sinon';
import { sandbox } from 'fetch-mock';
import * as fetch from 'node-fetch';
import mail, { Transporter } from 'nodemailer';
import { Payload } from '@hapi/boom';

import secretOrPrivateKey from '../secretOrPrivateKey';
import { cleanup, setup } from './sormasProband.spec.data/setup.helper';
import { db } from '../../src/db';
import server from '../../src/server';
import { config } from '../../src/config';
import pgHelper from '../../src/services/postgresqlHelper';
import sormasserviceClient from '../../src/clients/sormasserviceClient';
import authserviceClient from '../../src/clients/authserviceClient';
import personaldataserviceClient from '../../src/clients/personaldataserviceClient';
import { mock } from 'ts-mockito';

chai.use(chaiHttp);
chai.use(sinonChai);
const expect = chai.expect;
const fetchMock = sandbox();
const apiAddress = 'http://localhost:' + String(config.public.port);
const serverSandbox = sinon.createSandbox();
const testSandbox = sinon.createSandbox();

const probandSession1 = { id: 1, role: 'Proband', username: 'QTestProband1' };
const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher1',
};
const utSession = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'QTestUntersucher',
};
const sysadminSession = {
  id: 1,
  role: 'SysAdmin',
  username: 'QTestSystemAdmin',
};
const pmSession = {
  id: 1,
  role: 'ProbandenManager',
  username: 'QTestProbandenManager',
};

const probandToken1 = JWT.sign(probandSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherToken1 = JWT.sign(forscherSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const utToken = JWT.sign(utSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const sysadminToken = JWT.sign(sysadminSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmToken = JWT.sign(pmSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const probandHeader1 = { authorization: probandToken1 };
const forscherHeader1 = { authorization: forscherToken1 };
const utHeader = { authorization: utToken };
const sysadminHeader = { authorization: sysadminToken };
const pmHeader = { authorization: pmToken };

interface CreateSormasUserResponse {
  pseudonym: string;
  password: string | null;
}

interface CreateSormasUserRequest {
  compliance_labresults: boolean;
  compliance_samples: boolean;
  compliance_bloodsamples: boolean;
  study_center: string;
  examination_wave: number;
  study_accesses: string[];
  email: string;
  uuid: string;
}

function getData(): CreateSormasUserRequest {
  return {
    compliance_labresults: false,
    compliance_samples: false,
    compliance_bloodsamples: false,
    study_center: 'test_sz',
    examination_wave: 1,
    study_accesses: ['ApiTestStudy1'],
    email: 'sormas-proband@example.com',
    uuid: 'AAA-BBB-CCC-DDD',
  };
}

describe('/sormasProbands', function () {
  const sendMailStub = sinon.stub().resolves();

  before(async function () {
    const transporter = mock<Transporter>();
    transporter.sendMail = sendMailStub;
    serverSandbox.stub(mail, 'createTransport').returns(transporter);
    serverSandbox.stub(config, 'isSormasActive').value(true);
    await server.init();
  });

  after(async function () {
    await server.stop();
    serverSandbox.restore();
  });

  beforeEach(async function () {
    await setup();
  });

  afterEach(async function () {
    await cleanup();
    testSandbox.restore();
    sendMailStub.reset();
    fetchMock.restore();
  });

  describe('POST /sormasProbands', function () {
    let createSormasProbandDbSpy: SinonSpy;
    let createUserSpy: SinonSpy;

    beforeEach(function () {
      testSandbox
        .stub<typeof fetch, 'default'>(fetch, 'default')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .callsFake(fetchMock);
      fetchMock
        .post(/\/auth\/user/, async (_url, opts) => {
          await db.none(
            "INSERT INTO users(username,role,password) VALUES ($(username), 'Proband','')",
            JSON.parse(opts.body as string)
          );
          return opts.body;
        })
        .post(/\/sormas\/probands\/setStatus/, StatusCodes.NO_CONTENT)
        .put(/\/personal\/personalData\/proband\//, StatusCodes.NO_CONTENT);
      createSormasProbandDbSpy = testSandbox.spy(
        pgHelper,
        'createSormasProband'
      );
      createUserSpy = testSandbox.spy(authserviceClient, 'createUser');
    });

    it('should return 401 for a missing auth key', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/user/sormasProbands')
        .send(getData());
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 401 for a wrong auth key', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/user/sormasProbands')
        .set({ authorization: 'header.payload.signature' });
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 400 if email address is an empty string', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/user/sormasProbands')
        .set(pmHeader)
        .send({ ...getData(), email: '' });
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return 400 if email address is NOT submitted', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/user/sormasProbands')
        .set(pmHeader)
        .send({ ...getData(), email: undefined });
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return 400 if email address is invalid', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/user/sormasProbands')
        .set(pmHeader)
        .send({ ...getData(), email: 'inv:alid@example.com' });
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
      expect((result.body as Payload).message).to.contain('email');
    });

    it('should be forbidden to create sormas proband with role Sysadmin', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/user/sormasProbands')
        .set(sysadminHeader)
        .send(getData());
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should be forbidden to create sormas proband with role forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/user/sormasProbands')
        .set(forscherHeader1)
        .send(getData());
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should be forbidden to create sormas proband with role proband', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/user/sormasProbands')
        .set(probandHeader1)
        .send(getData());
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should be forbidden to create sormas proband with role UT', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/user/sormasProbands')
        .set(utHeader)
        .send(getData());
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 403 if role is not ProbandenManager', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/user/sormasProbands')
        .set(forscherHeader1)
        .send(getData());
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
      expect(createUserSpy.notCalled).to.be.true;
      expect(createSormasProbandDbSpy.notCalled).to.be.true;
      expect(sendMailStub.notCalled).to.be.true;
    });

    it('should return 403 if the ProbandenManager has no access to the given study', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/user/sormasProbands')
        .set(pmHeader)
        .send({
          ...getData(),
          study_accesses: ['ApiTestStudy3'],
        });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
      expect(createUserSpy.notCalled).to.be.true;
      expect(createSormasProbandDbSpy.notCalled).to.be.true;
      expect(sendMailStub.notCalled).to.be.true;
    });

    it('should return 409 if UUID is already in use', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/user/sormasProbands')
        .set(pmHeader)
        .send({
          ...getData(),
          uuid: 'exists',
        });
      expect(result).to.have.status(StatusCodes.CONFLICT);
      expect(createUserSpy.notCalled).to.be.true;
      expect(createSormasProbandDbSpy.notCalled).to.be.true;
      expect(sendMailStub.notCalled).to.be.true;
    });

    it('should throw an error if more than one studies are submittet (currently not supported)', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/user/sormasProbands')
        .set(pmHeader)
        .send({
          ...getData(),
          study_accesses: ['ApiTestStudy1', 'ApiTestStudy2'],
        });
      expect(result).to.have.status(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(createUserSpy.notCalled).to.be.true;
      expect(createSormasProbandDbSpy.notCalled).to.be.true;
      expect(sendMailStub.notCalled).to.be.true;
    });

    it('should throw an error if it cannot find a pseudonym that is not in use', async function () {
      const isUserExistentByUsernameStub = testSandbox
        .stub(pgHelper, 'isUserExistentByUsername')
        .resolves(true);
      const result = await chai
        .request(apiAddress)
        .post('/user/sormasProbands')
        .set(pmHeader)
        .send(getData());
      expect(result).to.have.status(StatusCodes.INTERNAL_SERVER_ERROR);
      const MAX_GENERATE_PSEUDONYM_TRIES = 1000;
      expect(isUserExistentByUsernameStub.callCount).to.equal(
        MAX_GENERATE_PSEUDONYM_TRIES
      );
      expect(createUserSpy.notCalled).to.be.true;
      expect(createSormasProbandDbSpy.notCalled).to.be.true;
      expect(sendMailStub.notCalled).to.be.true;
    });

    it('should return 200 and send a registration mail', async () => {
      const result = await chai
        .request(apiAddress)
        .post('/user/sormasProbands')
        .set(pmHeader)
        .send(getData());
      expect(result).to.have.status(StatusCodes.OK);
      expect(createUserSpy).to.be.calledOnce;
      expect(createSormasProbandDbSpy).to.be.calledOnce;
      expect(sendMailStub).to.be.calledOnce;
      const userForDb = createSormasProbandDbSpy.firstCall.args[0] as {
        pseudonym: string;
      };
      expect(userForDb.pseudonym).to.match(/APITEST-\d{5}/);
      expect((result.body as CreateSormasUserResponse).password).to.equal(null);
      expect((result.body as CreateSormasUserResponse).pseudonym).to.match(
        /APITEST-\d{5}/
      );
    });

    it('should return 200 and the password if registration mail could not be sent', async () => {
      sendMailStub.rejects(new Error('TEST: mailSend Error'));

      const result = await chai
        .request(apiAddress)
        .post('/user/sormasProbands')
        .set(pmHeader)
        .send(getData());
      expect(result).to.have.status(StatusCodes.OK);
      expect(createUserSpy).to.be.calledOnce;
      expect(createSormasProbandDbSpy).to.be.calledOnce;
      expect(sendMailStub).to.be.calledOnce;
      const userForDb = createSormasProbandDbSpy.firstCall.args[0] as {
        pseudonym: string;
      };
      expect(userForDb.pseudonym).to.match(/APITEST-\d{5}/);
      expect(
        (result.body as CreateSormasUserResponse).password?.length
      ).to.equal(config.userPasswordLength);
      expect((result.body as CreateSormasUserResponse).pseudonym).to.match(
        /APITEST-\d{5}/
      );
    });

    it('should return 200 and set the "REGISTERED" status in SORMAS', async function () {
      const setStatusSpy = testSandbox.spy(sormasserviceClient, 'setStatus');

      const result = await chai
        .request(apiAddress)
        .post('/user/sormasProbands')
        .set(pmHeader)
        .send(getData());
      expect(result).to.have.status(StatusCodes.OK);
      expect((result.body as CreateSormasUserResponse).pseudonym).to.match(
        /APITEST-\d{5}/
      );
      expect((result.body as CreateSormasUserResponse).password).to.equal(null);

      expect(setStatusSpy).to.be.calledOnce;
      expect(setStatusSpy).to.be.calledWith('AAA-BBB-CCC-DDD', 'REGISTERED');
      expect(createUserSpy).to.be.calledOnce;
    });

    it('should return 200 and store all data and also the email via personaldataservice', async function () {
      const updatePersonalDataSpy = testSandbox.spy(
        personaldataserviceClient,
        'updatePersonalData'
      );

      const result = await chai
        .request(apiAddress)
        .post('/user/sormasProbands')
        .set(pmHeader)
        .send(getData());
      expect(result).to.have.status(StatusCodes.OK);
      expect((result.body as CreateSormasUserResponse).pseudonym).to.match(
        /APITEST-\d{5}/
      );
      expect((result.body as CreateSormasUserResponse).password).to.equal(null);

      expect(updatePersonalDataSpy).to.be.calledOnce;
      expect(updatePersonalDataSpy.firstCall.firstArg).to.match(
        /APITEST-\d{5}/
      );
      expect(updatePersonalDataSpy.firstCall.lastArg).to.deep.equal({
        email: 'sormas-proband@example.com',
      });

      const dbUser: { ids: string } | null = await db.oneOrNone(
        'SELECT ids FROM users WHERE username = $(pseudonym)',
        result.body
      );
      expect(dbUser).to.be.an('object');
      expect(dbUser?.ids).to.equal('AAA-BBB-CCC-DDD');
    });
  });
});
