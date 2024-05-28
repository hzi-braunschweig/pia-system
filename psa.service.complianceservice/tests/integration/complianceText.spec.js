/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiExclude = require('chai-exclude');
chai.use(chaiHttp);
chai.use(chaiExclude);
const expect = chai.expect;

const { config } = require('../../src/config');
const { Server } = require('../../src/server');
const apiAddress = `http://localhost:${config.public.port}`;

const { sequelize, ComplianceText } = require('../../src/db');
const {
  AuthTokenMockBuilder,
  AuthServerMock,
} = require('@pia/lib-service-core');

const researcherHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: ['QTeststudy', 'QTeststudie2'],
});
const researcherHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher2',
  studies: ['QTeststudy44', 'QTeststudie33'],
});

const probandHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['QTeststudy'],
});
const probandHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband2',
  studies: ['QTeststudy33'],
});

describe('Compliance Text API', () => {
  const studyName = 'QTeststudy';
  before(async () => {
    await sequelize.sync();
    await Server.init();
  });

  after(async () => {
    await Server.stop();
  });

  beforeEach(async () => {
    await ComplianceText.destroy({ truncate: true, cascade: true });
  });

  describe('POST /admin/compliance/text/preview', () => {
    beforeEach(() => AuthServerMock.adminRealm().returnValid());
    afterEach(AuthServerMock.cleanAll);

    it('should return 200 and the converted text', async () => {
      const res = await chai
        .request(apiAddress)
        .post('/admin/text/preview')
        .set(researcherHeader)
        .send({
          compliance_text:
            '# hello world \n' +
            'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ' +
            'ut labore et dolore magna aliquyam erat, sed diam voluptua.\n' +
            'At vero eos et accusam et justo duo dolores et ea rebum.\n' +
            '* Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.\n' +
            '* Lorem ipsum dolor sit amet, consetetur sadipscing elitr,\n' +
            '* sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.\n' +
            '\n' +
            '<pia-consent-input-radio-app></pia-consent-input-radio-app>\n' +
            'Another <i>italic</i> text\n' +
            '<pia-consent-switch-radio-system name="app">\n' +
            '<pia-case value="false">\n' +
            'Text if false' +
            '</pia-case>\n' +
            '<pia-case value="true">\n' +
            'Text if true' +
            '</pia-case>\n' +
            '</pia-consent-switch-radio-system>\n' +
            '# At vero\n' +
            'Eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata ' +
            'sanctus est Lorem ipsum dolor sit amet.',
        });

      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.be.an.instanceOf(Array);
      const switchElement = res.body.find(
        (el) => el.tagName === 'pia-consent-switch-radio-system'
      );
      expect(switchElement).to.not.be.undefined;
      expect(switchElement.children.length).to.equal(2);
    });

    it('should return 403 if proband tries', async () => {
      const res = await chai
        .request(apiAddress)
        .post('/admin/text/preview')
        .send({ compliance_text: '# hello world' })
        .set(probandHeader);

      // Assert
      expect(res).to.have.status(403);
    });
  });

  describe('GET /{studyName}/text', () => {
    beforeEach(() => AuthServerMock.probandRealm().returnValid());
    afterEach(AuthServerMock.cleanAll);

    it('should return 204 if no text exists', async () => {
      const res = await chai
        .request(apiAddress)
        .get(`/${studyName}/text`)
        .set(probandHeader);

      // Assert
      expect(res).to.have.status(204);
    });

    it('should return 204 if text exists but for Untersuchungsteam', async () => {
      await ComplianceText.create({
        study: studyName,
        text: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr.',
        to_be_filled_by: 'Untersuchungsteam',
      });
      const res = await chai
        .request(apiAddress)
        .get(`/${studyName}/text`)
        .set(probandHeader);

      // Assert
      expect(res).to.have.status(204);
    });

    it('should return 200 if text exists', async () => {
      await ComplianceText.create({
        study: studyName,
        text: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr.',
        to_be_filled_by: 'Proband',
      });
      const res = await chai
        .request(apiAddress)
        .get(`/${studyName}/text`)
        .set(probandHeader);

      // Assert
      expect(res).to.have.status(200);
      expect(res.body.compliance_text).to.equal(
        'Lorem ipsum dolor sit amet, consetetur sadipscing elitr.'
      );
      expect(res.body.compliance_text_object).to.deep.equal([
        {
          type: 'HTML',
          html: '<p>Lorem ipsum dolor sit amet, consetetur sadipscing elitr.</p>',
        },
      ]);
    });

    it('should return 403 if a researcher tries', async () => {
      const res = await chai
        .request(apiAddress)
        .get(`/${studyName}/text`)
        .set(researcherHeader);

      // Assert
      expect(res).to.have.status(403);
    });

    it('should return 403 if an unauthorized proband tires', async () => {
      const res = await chai
        .request(apiAddress)
        .get(`/${studyName}/text`)
        .set(probandHeader2);
      expect(res).to.have.status(403);
    });
  });

  describe('GET /admin/{studyName}/text/edit', () => {
    beforeEach(() => AuthServerMock.adminRealm().returnValid());
    afterEach(AuthServerMock.cleanAll);

    it('should return 204 if no text exists', async () => {
      const res = await chai
        .request(apiAddress)
        .get(`/admin/${studyName}/text/edit`)
        .set(researcherHeader);

      // Assert
      expect(res).to.have.status(204);
    });

    it('should return 200 with text and to-be-filled-by', async () => {
      await ComplianceText.create({
        study: studyName,
        text: 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr.',
        to_be_filled_by: 'Untersuchungsteam',
      });
      const res = await chai
        .request(apiAddress)
        .get(`/admin/${studyName}/text/edit`)
        .set(researcherHeader);

      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.deep.equal({
        compliance_text:
          'Lorem ipsum dolor sit amet, consetetur sadipscing elitr.',
        to_be_filled_by: 'Untersuchungsteam',
      });
    });

    it('should return 403 if an unauthorized researcher tires', async () => {
      const res = await chai
        .request(apiAddress)
        .get(`/admin/${studyName}/text/edit`)
        .set(researcherHeader2);
      expect(res).to.have.status(403);
    });

    it('should return 403 if proband tries', async () => {
      const res = await chai
        .request(apiAddress)
        .get(`/admin/${studyName}/text/edit`)
        .set(probandHeader);

      // Assert
      expect(res).to.have.status(403);
    });
  });

  describe('PUT /admin/{studyName}/text', () => {
    beforeEach(() => AuthServerMock.adminRealm().returnValid());
    afterEach(AuthServerMock.cleanAll);

    it('should return 200 and true if text exists', async () => {
      const res = await chai
        .request(apiAddress)
        .put(`/admin/${studyName}/text`)
        .set(researcherHeader)
        .send({
          compliance_text:
            '#Hello World\nLorem ipsum dolor sit amet, consetetur sadipscing elitr.',
          to_be_filled_by: 'Proband',
        });

      // Assert
      expect(res).to.have.status(200);
    });

    it('should return 403 if an unauthorized researcher tires', async () => {
      const res = await chai
        .request(apiAddress)
        .put(`/admin/${studyName}/text`)
        .set(researcherHeader2)
        .send({
          compliance_text:
            '#Hello World\nLorem ipsum dolor sit amet, consetetur sadipscing elitr.',
          to_be_filled_by: 'Proband',
        });

      // Assert
      expect(res).to.have.status(403);
    });

    it('should return 403 if proband tries', async () => {
      const res = await chai
        .request(apiAddress)
        .put(`/admin/${studyName}/text`)
        .set(probandHeader)
        .send({
          compliance_text:
            '#Hello World\nLorem ipsum dolor sit amet, consetetur sadipscing elitr.',
          to_be_filled_by: 'Proband',
        });

      // Assert
      expect(res).to.have.status(403);
    });
  });

  describe('GET /{studyName}/active', () => {
    beforeEach(() => AuthServerMock.probandRealm().returnValid());
    afterEach(AuthServerMock.cleanAll);

    it('should return 200 and false if no text exists', async () => {
      const res = await chai
        .request(apiAddress)
        .get(`/${studyName}/active`)
        .set(probandHeader);

      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.be.false;
    });

    it('should return 200 and true if text exists', async () => {
      await ComplianceText.create({
        study: studyName,
        text: '<pia-consent-radio-app></pia-consent-radio-app>',
        to_be_filled_by: 'Proband',
      });
      const res = await chai
        .request(apiAddress)
        .get(`/${studyName}/active`)
        .set(probandHeader);

      // Assert
      expect(res).to.have.status(200);
      expect(res.body).to.be.true;
    });

    it('should return 403 if an unauthorized researcher tires', async () => {
      const res = await chai
        .request(apiAddress)
        .get(`/${studyName}/active`)
        .set(probandHeader2);
      expect(res).to.have.status(403);
    });
  });
});
