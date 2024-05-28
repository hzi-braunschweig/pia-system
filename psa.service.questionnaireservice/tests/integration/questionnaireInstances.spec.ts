/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */

import {
  MessageQueueClient,
  MessageQueueTopic,
  QuestionnaireInstanceReleasedMessage,
} from '@pia/lib-messagequeue';

import {
  AuthServerMock,
  AuthTokenMockBuilder,
  GlobalConfig,
} from '@pia/lib-service-core';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { StatusCodes } from 'http-status-codes';
import { config } from '../../src/config';
import { Question as QuestionDeprecated } from '../../src/models/question';
import { QuestionnaireInstance as QuestionnaireInstanceDeprecated } from '../../src/models/questionnaireInstance';
import { Server } from '../../src/server';
import {
  cleanup,
  setup,
} from './questionnaireInstances.spec.data/setup.helper';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const probandHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-studie-proband1',
  studies: [],
});
const probandHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-studi2-proband',
  studies: [],
});
const probandHeader3 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-studi4-proband3',
  studies: [],
});
const forscherHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: ['ApiTestMultiProfs', 'ApiTestStudie'],
});
const forscherHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher2',
  studies: ['ApiTestMultiProfs', 'ApiTestStudi2', 'ApiTestStudi4'],
});
const pmHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'qtest-probandenmanager',
  studies: ['ApiTestMultiProfs', 'ApiTestStudie'],
});
const utHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'qtest-untersuchungsteam',
  studies: ['ApiTestMultiProfs', 'ApiTestStudie'],
});
const utHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'qtest-untersuchungsteam2',
  studies: ['ApiTestMultiProfs', 'ApiTestStudi2'],
});

describe('/questionnaireInstances', function () {
  before(async () => {
    await Server.init();
    await setup();
  });

  after(async () => {
    await Server.stop();
    await cleanup();
  });

  beforeEach(() => {
    AuthServerMock.adminRealm().returnValid();
    AuthServerMock.probandRealm().returnValid();
  });
  afterEach(AuthServerMock.cleanAll);

  describe('PUT /admin/questionnaireInstance/{id}', function () {
    it('should return HTTP 403 if a Forscher tries', async () => {
      // Arrange
      const questionnaireInstanceId = 99998;

      // Act
      const result = await chai
        .request(apiAddress)
        .put(
          '/admin/questionnaireInstances/' + questionnaireInstanceId.toString()
        )
        .set(forscherHeader2)
        .send({
          status: 'in_progress',
          progress: 15,
        });

      // Assert
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if a UT tries for FB that is for proband', async () => {
      // Arrange
      const questionnaireInstanceId = 99998;

      // Act
      const result = await chai
        .request(apiAddress)
        .put(
          '/admin/questionnaireInstances/' + questionnaireInstanceId.toString()
        )
        .set(utHeader)
        .send({
          status: 'in_progress',
          progress: 15,
        });

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with the put QI if a UT tries to set just progress value', async () => {
      // Arrange
      const questionnaireInstanceId = 7777771;

      // Act
      const result = await chai
        .request(apiAddress)
        .put(
          '/admin/questionnaireInstances/' + questionnaireInstanceId.toString()
        )
        .set(utHeader)
        .send({ progress: 15 });

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.deep.include({
        id: questionnaireInstanceId,
        status: 'active',
        user_id: 'qtest-studie-proband1',
        date_of_release_v1: null,
        date_of_release_v2: null,
        release_version: 0,
        links: {
          answers: {
            href: `/questionnaireInstances/${questionnaireInstanceId}/answers`,
          },
          self: {
            href: `/questionnaireInstances/${questionnaireInstanceId}`,
          },
        },
      });
    });

    it('should return HTTP 200 with the put QI if a UT tries to set status to in_progress', async () => {
      // Arrange
      const questionnaireInstanceId = 7777771;

      // Act
      const result = await chai
        .request(apiAddress)
        .put(
          '/admin/questionnaireInstances/' + questionnaireInstanceId.toString()
        )
        .set(utHeader)
        .send({
          status: 'in_progress',
          progress: 15,
        });

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.deep.include({
        id: questionnaireInstanceId,
        status: 'in_progress',
        user_id: 'qtest-studie-proband1',
        date_of_release_v1: null,
        date_of_release_v2: null,
        release_version: 0,
        links: {
          answers: {
            href: `/questionnaireInstances/${questionnaireInstanceId}/answers`,
          },
          self: {
            href: `/questionnaireInstances/${questionnaireInstanceId}`,
          },
        },
      });
    });

    it('should return HTTP 200 with the put QI if a UT tries to set status to released', async () => {
      // Arrange
      const questionnaireInstanceId = 7777771;

      // Act
      const result = await chai
        .request(apiAddress)
        .put(
          '/admin/questionnaireInstances/' + questionnaireInstanceId.toString()
        )
        .set(utHeader)
        .send({
          status: 'released',
          progress: 15,
          release_version: 1,
        });

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.deep.include({
        id: questionnaireInstanceId,
        status: 'released',
        user_id: 'qtest-studie-proband1',
        date_of_release_v1: null,
        date_of_release_v2: null,
        release_version: 1,
        links: {
          answers: {
            href: `/questionnaireInstances/${questionnaireInstanceId}/answers`,
          },
          self: {
            href: `/questionnaireInstances/${questionnaireInstanceId}`,
          },
        },
      });
    });

    it('should post to the messagequeue when the set status got set to released for UT', function (done) {
      // Arrange
      const questionnaireInstanceId = 7777771;
      const testMessageQueueService = new MessageQueueClient(
        GlobalConfig.getMessageQueue('testservice')
      );

      void testMessageQueueService
        .connect()
        .then(async () => {
          return testMessageQueueService.createConsumer(
            MessageQueueTopic.QUESTIONNAIRE_INSTANCE_RELEASED,
            async (message: QuestionnaireInstanceReleasedMessage) => {
              // Assert #2
              expect(message.id).to.eql(questionnaireInstanceId);
              expect(message.studyName).to.eql('ApiTestStudie');

              await testMessageQueueService.disconnect();
              done();
            }
          );
        })
        // Act
        .then(async () => {
          return chai
            .request(apiAddress)
            .put(
              '/admin/questionnaireInstances/' +
                questionnaireInstanceId.toString()
            )
            .set(utHeader)
            .send({
              status: 'released',
              progress: 15,
              release_version: 1,
            });
        })
        // Assert #1
        .then((result) => expect(result).to.have.status(200));
    });

    it('should return HTTP 200 with the put QI if a UT tries to set status to released again and increment release_version', async () => {
      // Arrange
      const questionnaireInstanceId = 7777771;

      // Act
      const result = await chai
        .request(apiAddress)
        .put(
          '/admin/questionnaireInstances/' + questionnaireInstanceId.toString()
        )
        .set(utHeader)
        .send({
          status: 'released',
          progress: 15,
          release_version: 2,
        });

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.deep.include({
        id: questionnaireInstanceId,
        status: 'released',
        user_id: 'qtest-studie-proband1',
        date_of_release_v1: null,
        date_of_release_v2: null,
        release_version: 2,
        links: {
          answers: {
            href: `/questionnaireInstances/${questionnaireInstanceId}/answers`,
          },
          self: {
            href: `/questionnaireInstances/${questionnaireInstanceId}`,
          },
        },
      });
    });
  });

  describe('PUT /questionnaireInstance/{id}', function () {
    it('should return HTTP 400 if the status is invalid', async () => {
      // Arrange
      const questionnaireInstanceId = 99998;

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/questionnaireInstances/' + questionnaireInstanceId.toString())
        .set(probandHeader1)
        .send({
          status: 'invalidStatus',
          progress: 15,
        });

      // Assert
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 404 if a Proband tries to set status to active on released qI', async () => {
      // Arrange
      const questionnaireInstanceId = 99996;

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/questionnaireInstances/' + questionnaireInstanceId.toString())
        .set(probandHeader1)
        .send({
          status: 'active',
          progress: 0,
        });

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a Proband tries to change progress on released qI', async () => {
      // Arrange
      const questionnaireInstanceId = 99996;

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/questionnaireInstances/' + questionnaireInstanceId.toString())
        .set(probandHeader1)
        .send({
          status: 'active',
          progress: 0,
        });

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a Proband tries that is not assigned to QI', async () => {
      // Arrange
      const questionnaireInstanceId = 99998;

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/questionnaireInstances/' + questionnaireInstanceId.toString())
        .set(probandHeader2)
        .send({
          status: 'in_progress',
          progress: 15,
        });

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if the QI id is invalid', async () => {
      // Arrange
      const questionnaireInstanceId = 88888;

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/questionnaireInstances/' + questionnaireInstanceId.toString())
        .set(probandHeader1)
        .send({
          status: 'in_progress',
          progress: 15,
        });

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with the put QI if a Proband tries to set just progress value', async () => {
      // Arrange
      const questionnaireInstanceId = 99998;

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/questionnaireInstances/' + questionnaireInstanceId.toString())
        .set(probandHeader1)
        .send({ progress: 15 });

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.deep.include({
        id: questionnaireInstanceId,
        status: 'active',
        user_id: 'qtest-studie-proband1',
        date_of_release_v1: null,
        date_of_release_v2: null,
        release_version: 0,
        links: {
          answers: {
            href: `/questionnaireInstances/${questionnaireInstanceId}/answers`,
          },
          self: {
            href: `/questionnaireInstances/${questionnaireInstanceId}`,
          },
        },
      });
    });

    it('should return HTTP 200 with the put QI if a Proband tries to set status to in_progress', async () => {
      // Arrange
      const questionnaireInstanceId = 99998;

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/questionnaireInstances/' + questionnaireInstanceId.toString())
        .set(probandHeader1)
        .send({
          status: 'in_progress',
          progress: 15,
        });

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.deep.include({
        id: questionnaireInstanceId,
        status: 'in_progress',
        user_id: 'qtest-studie-proband1',
        date_of_release_v1: null,
        date_of_release_v2: null,
        release_version: 0,
        links: {
          answers: {
            href: `/questionnaireInstances/${questionnaireInstanceId}/answers`,
          },
          self: {
            href: `/questionnaireInstances/${questionnaireInstanceId}`,
          },
        },
      });
    });

    it('should return HTTP 200 with the put QI if a Proband tries to set status to released_once', async () => {
      // Arrange
      const questionnaireInstanceId = 99998;

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/questionnaireInstances/' + questionnaireInstanceId.toString())
        .set(probandHeader1)
        .send({
          status: 'released_once',
          progress: 15,
        });

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.deep.include({
        id: questionnaireInstanceId,
        status: 'released_once',
        user_id: 'qtest-studie-proband1',
        release_version: 1,
        links: {
          answers: {
            href: `/questionnaireInstances/${questionnaireInstanceId}/answers`,
          },
          self: {
            href: `/questionnaireInstances/${questionnaireInstanceId}`,
          },
        },
      });
    });

    it('should return HTTP 200 and update date of issue if cycle unit is "spontan" when releasing once', async () => {
      // Arrange
      const questionnaireInstanceId = 444441;

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/questionnaireInstances/' + questionnaireInstanceId.toString())
        .set(probandHeader1)
        .send({
          status: 'released_once',
          progress: 15,
        });

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body)
        .to.have.property('date_of_issue')
        .and.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        .and.not.equal('1970-11-30T23:00:00.000Z');

      expect(result.body).to.deep.include({
        id: questionnaireInstanceId,
        status: 'released_once',
        user_id: 'qtest-studie-proband1',
        release_version: 1,
        links: {
          answers: {
            href: `/questionnaireInstances/${questionnaireInstanceId}/answers`,
          },
          self: {
            href: `/questionnaireInstances/${questionnaireInstanceId}`,
          },
        },
      });
    });

    it('should return HTTP 200 keep not modify date of issue if cycle unit is "spontan" not releasing once', async () => {
      // Arrange
      const questionnaireInstanceId = 444440;

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/questionnaireInstances/' + questionnaireInstanceId.toString())
        .set(probandHeader1)
        .send({
          status: 'in_progress',
          progress: 15,
        });

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body)
        .to.have.property('date_of_issue')
        .and.equal('1970-11-30T23:00:00.000Z');

      expect(result.body).to.deep.include({
        id: questionnaireInstanceId,
        status: 'in_progress',
        user_id: 'qtest-studie-proband1',
        release_version: 0,
        links: {
          answers: {
            href: `/questionnaireInstances/${questionnaireInstanceId}/answers`,
          },
          self: {
            href: `/questionnaireInstances/${questionnaireInstanceId}`,
          },
        },
      });
    });

    it('should return HTTP 200 with the put QI if a Proband tries to set status to released_twice', async () => {
      // Arrange
      const questionnaireInstanceId = 99998;

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/questionnaireInstances/' + questionnaireInstanceId.toString())
        .set(probandHeader1)
        .send({
          status: 'released_twice',
          progress: 15,
        });

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.deep.include({
        id: questionnaireInstanceId,
        status: 'released_twice',
        user_id: 'qtest-studie-proband1',
        release_version: 2,
        links: {
          answers: {
            href: `/questionnaireInstances/${questionnaireInstanceId}/answers`,
          },
          self: {
            href: `/questionnaireInstances/${questionnaireInstanceId}`,
          },
        },
      });
      expect(result.body.date_of_release_v1).to.not.equal(null);
      expect(result.body.date_of_release_v2).to.not.equal(null);
      expect(result.body.date_of_release_v2).to.not.equal(
        result.body.date_of_release_v1
      );
    });

    it('should post to the messagequeue when the set status got set to released for proband', function (done) {
      const testMessageQueueService = new MessageQueueClient(
        GlobalConfig.getMessageQueue('testservice')
      );
      void testMessageQueueService
        .connect()
        .then(async () => {
          return testMessageQueueService.createConsumer(
            MessageQueueTopic.QUESTIONNAIRE_INSTANCE_RELEASED,
            async (message: QuestionnaireInstanceReleasedMessage) => {
              expect(message.id).to.eql(99995);
              expect(message.studyName).to.eql('ApiTestStudie');
              await testMessageQueueService.disconnect();
              done();
            }
          );
        })
        .then(async () => {
          return chai
            .request(apiAddress)
            .put('/questionnaireInstances/99995')
            .set(probandHeader1)
            .send({
              status: 'released_twice',
              progress: 15,
            });
        })
        .then((result) =>
          // Assert
          expect(result).to.have.status(200)
        );
    });

    it('should return HTTP 404 if a Proband tries to set status to released_once when it is released_twice', async () => {
      // Arrange
      const questionnaireInstanceId = 99998;

      // Act
      const result = await chai
        .request(apiAddress)
        .put('/questionnaireInstances/' + questionnaireInstanceId.toString())
        .set(probandHeader1)
        .send({
          status: 'released_once',
          progress: 15,
        });

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });
  });

  describe('GET /questionnaireInstances', function () {
    it('should return HTTP 403 if a Forscher tries', async () => {
      // Arrange
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances')
        .set(forscherHeader1);

      // Assert
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a UT tries', async () => {
      // Arrange
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances')
        .set(utHeader);

      // Assert
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 with empty array if a Proband has no QIs assigned to him', async () => {
      // Arrange
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances')
        .set(probandHeader2);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.questionnaireInstances.length).to.equal(0);
      expect(result.body.links.self.href).to.equal('/questionnaireInstances');
    });

    it('should return HTTP 200 with all QIs for a Proband', async () => {
      // Arrange
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances')
        .set(probandHeader1);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.questionnaireInstances.length).to.equal(6);
      expect(result.body.questionnaireInstances[0].user_id).to.equal(
        'qtest-studie-proband1'
      );
      expect(result.body.questionnaireInstances[1].user_id).to.equal(
        'qtest-studie-proband1'
      );
      expect(result.body.questionnaireInstances[0].questionnaire).to.not.equal(
        undefined
      );
      expect(result.body.links.self.href).to.equal('/questionnaireInstances');
    });

    it('should return HTTP 200 with all QIs and correctly filtered questionnaire data for a Proband', async () => {
      // Arrange
      // Act
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances')
        .set(probandHeader3);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.questionnaireInstances.length).to.equal(8);

      const qI100888892: QuestionnaireInstanceDeprecated =
        result.body.questionnaireInstances.find(
          (qi: QuestionnaireInstanceDeprecated) => qi.id === 100888892
        );
      expect(qI100888892.questionnaire.questions).to.have.length(3);

      const q888889 = qI100888892.questionnaire.questions.find(
        (q: QuestionDeprecated) => q.id === 888889
      );
      expect(q888889.answer_options).to.have.length(1);

      const q888890 = qI100888892.questionnaire.questions.find(
        (q: QuestionDeprecated) => q.id === 888890
      );
      expect(q888890.answer_options).to.have.length(2);

      const q888891 = qI100888892.questionnaire.questions.find(
        (q: QuestionDeprecated) => q.id === 888891
      );
      expect(q888891.answer_options).to.have.length(0);

      expect(result.body.links.self.href).to.equal('/questionnaireInstances');
    });
  });

  describe('GET /admin/user/{pseudonym}/questionnaireInstances', function () {
    it('should return HTTP 200 with empty array for forscher if the user does not exist', async () => {
      // Arrange
      const pseudonym = 'michGibtsNicht';

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/user/' + pseudonym + '/questionnaireInstances')
        .set(forscherHeader1);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.questionnaireInstances.length).to.equal(0);
    });

    it('should return HTTP 200 with empty array for PM if the user does not exist', async () => {
      // Arrange
      const pseudonym = 'michGibtsNicht';

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/user/' + pseudonym + '/questionnaireInstances')
        .set(pmHeader);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.questionnaireInstances.length).to.equal(0);
    });

    it('should return HTTP 200 with empty array if the user is in a different study than the Forscher', async () => {
      // Arrange
      const pseudonym = 'qtest-studi2-proband';

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/user/' + pseudonym + '/questionnaireInstances')
        .set(forscherHeader1);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.questionnaireInstances.length).to.equal(0);
    });

    it('should return HTTP 200 with empty array if the user is in a different study than the PM', async () => {
      // Arrange
      const pseudonym = 'qtest-studi2-proband';

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/user/' + pseudonym + '/questionnaireInstances')
        .set(pmHeader);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.questionnaireInstances.length).to.equal(0);
    });

    it('should return HTTP 200 with empty array if the user has no QIs assigned to him', async () => {
      // Arrange
      const pseudonym = 'qtest-studi2-proband';

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/user/' + pseudonym + '/questionnaireInstances')
        .set(forscherHeader2);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.questionnaireInstances.length).to.equal(0);
      expect(result.body.links.self.href).to.equal('/questionnaireInstances');
    });

    it('should return HTTP 200 with all QIs for the proband for forscher', async () => {
      // Arrange
      const pseudonym = 'qtest-studie-proband1';

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/user/' + pseudonym + '/questionnaireInstances')
        .set(forscherHeader1);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.questionnaireInstances.length).to.equal(7);
      expect(result.body.questionnaireInstances[0].user_id).to.equal(
        'qtest-studie-proband1'
      );
      expect(result.body.questionnaireInstances[1].user_id).to.equal(
        'qtest-studie-proband1'
      );
      expect(result.body.links.self.href).to.equal('/questionnaireInstances');
    });

    it('should return HTTP 200 with all released QIs for the Proband for PM', async () => {
      // Arrange
      const pseudonym = 'qtest-studie-proband1';

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/user/' + pseudonym + '/questionnaireInstances')
        .set(pmHeader);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.questionnaireInstances.length).to.equal(4);
      expect(result.body.questionnaireInstances[0].user_id).to.equal(
        'qtest-studie-proband1'
      );
      expect(result.body.questionnaireInstances[1].user_id).to.equal(
        'qtest-studie-proband1'
      );
      expect(result.body.links.self.href).to.equal('/questionnaireInstances');
    });

    it('should return HTTP 200 with all QIs for the proband which are for UT for UT', async () => {
      // Arrange
      const pseudonym = 'qtest-studie-proband1';

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/user/' + pseudonym + '/questionnaireInstances')
        .set(utHeader);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.questionnaireInstances.length).to.equal(1);
      expect(result.body.questionnaireInstances[0].user_id).to.equal(
        'qtest-studie-proband1'
      );
      expect(result.body.questionnaireInstances[0].questionnaire.type).to.equal(
        'for_research_team'
      );
      expect(result.body.links.self.href).to.equal('/questionnaireInstances');
    });

    it('should return HTTP 200 with empty list of instances if UT is not in the same study as Proband', async () => {
      // Arrange
      const pseudonym = 'qtest-studie-proband1';

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/user/' + pseudonym + '/questionnaireInstances')
        .set(utHeader2);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.questionnaireInstances.length).to.equal(0);
      expect(result.body.links.self.href).to.equal('/questionnaireInstances');
    });

    it('should also accept pseudonyms in uppercase and return HTTP 200', async () => {
      // Arrange
      const pseudonym = 'QTest-Studie-Proband1';

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/user/' + pseudonym + '/questionnaireInstances')
        .set(utHeader);

      // Assert
      expect(result.body.questionnaireInstances[0].user_id).to.equal(
        'qtest-studie-proband1'
      );
    });

    it('should return HTTP 404 if a Proband tries', async () => {
      // Arrange
      const pseudonym = 'qtest-studie-proband1';

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/user/' + pseudonym + '/questionnaireInstances/')
        .set(probandHeader1);

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with all QIs and correctly filtered questionnaire data for a Forscher', async () => {
      // Arrange
      const pseudonym = 'qtest-studi4-proband3';

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/admin/user/' + pseudonym + '/questionnaireInstances')
        .set(forscherHeader2);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.questionnaireInstances.length).to.equal(8);

      expect(result.body.links.self.href).to.equal('/questionnaireInstances');
    });
  });

  describe('GET /admin/questionnaireInstances/{id}', function () {
    it('should return HTTP 404 if the QI id is wrong', async () => {
      // Arrange
      const questionnaireInstanceId = 88888;

      // Act
      const result = await chai
        .request(apiAddress)
        .get(
          '/admin/questionnaireInstances/' + questionnaireInstanceId.toString()
        )
        .set(forscherHeader1);

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if the Forscher has no read access to study', async () => {
      // Arrange
      const questionnaireInstanceId = 99999;

      // Act
      const result = await chai
        .request(apiAddress)
        .get(
          '/admin/questionnaireInstances/' + questionnaireInstanceId.toString()
        )
        .set(forscherHeader2);

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a UT tries and the QI is not for UTs', async () => {
      // Arrange
      const questionnaireInstanceId = 99999;

      // Act
      const result = await chai
        .request(apiAddress)
        .get(
          '/admin/questionnaireInstances/' + questionnaireInstanceId.toString()
        )
        .set(utHeader);

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a UT tries and the QI is not for a proband in his studies', async () => {
      // Arrange
      const questionnaireInstanceId = 7777771;

      // Act
      const result = await chai
        .request(apiAddress)
        .get(
          '/admin/questionnaireInstances/' + questionnaireInstanceId.toString()
        )
        .set(utHeader2);

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with the correct QI if a Forscher tries', async () => {
      // Arrange
      const questionnaireInstanceId = 99999;

      // Act
      const result = await chai
        .request(apiAddress)
        .get(
          '/admin/questionnaireInstances/' + questionnaireInstanceId.toString()
        )
        .set(forscherHeader1);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.study_id).to.equal('ApiTestStudie');
      expect(result.body.status).to.equal('active');
      expect(result.body.date_of_release_v1).to.equal(null);
      expect(result.body.date_of_release_v2).to.equal(null);
      expect(result.body.links.self.href).to.equal(
        '/questionnaireInstances/99999'
      );
    });

    it('should return HTTP 200 with the correct QI if a UT tries for instances that is for UTs', async () => {
      // Arrange
      const questionnaireInstanceId = 7777771;

      // Act
      const result = await chai
        .request(apiAddress)
        .get(
          '/admin/questionnaireInstances/' + questionnaireInstanceId.toString()
        )
        .set(utHeader);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.study_id).to.equal('ApiTestStudie');
      expect(result.body.status).to.equal('released');
      expect(result.body.date_of_release_v1).to.equal(null);
      expect(result.body.date_of_release_v2).to.equal(null);
      expect(result.body.links.self.href).to.equal(
        '/questionnaireInstances/7777771'
      );
    });
  });

  describe('GET /questionnaireInstances/{id}', function () {
    it('should return HTTP 404 if a Proband tries and the QI has status inactive', async () => {
      // Arrange
      const questionnaireInstanceId = 99997;

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/' + questionnaireInstanceId.toString())
        .set(probandHeader1);

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if an instances has no questionnaire data due to only unfullfilled conditions', async () => {
      // Arrange
      const questionnaireInstanceId = 100777778;

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/' + questionnaireInstanceId.toString())
        .set(probandHeader3);

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 if an instances has no questionnaire data due to only unfullfilled conditions but it is the first instance', async () => {
      // Arrange
      const questionnaireInstanceId = 100777777;

      // Act
      const result = await chai
        .request(apiAddress)
        .get('/questionnaireInstances/' + questionnaireInstanceId.toString())
        .set(probandHeader3);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.user_id).to.equal('qtest-studi4-proband3');
      expect(result.body.status).to.equal('released_once');
      expect(result.body.questionnaire.questions.length).to.equal(2);
      expect(result.body.date_of_release_v1).to.not.equal(null);
      expect(result.body.date_of_release_v2).to.equal(null);
      expect(result.body.links.self.href).to.equal(
        '/questionnaireInstances/100777777'
      );
    });
  });

  describe('POST /admin/questionnaireInstances/{id}/answers', function () {
    it('should return HTTP 200 if the file type is allowed', async () => {
      // Arrange
      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/questionnaireInstances/1234567/answers')
        .set(utHeader)
        .send({
          answers: [
            {
              question_id: 12345,
              answer_option_id: 12345,
              value: JSON.stringify({
                file_name: 'file.pdf',
                data: 'data:application/pdf;base64,JVBERi0xLjMNCiXi48/TDQoNCjEgMCBvYmoNCjw8DQovVHlwZSAvQ2F0YWxvZw0KL091dGxpbmVzIDIgMCBSDQovUGFnZXMgMyAwIFINCj4+DQplbmRvYmoNCg0KMiAwIG9iag0KPDwNCi9UeXBlIC9PdXRsaW5lcw0KL0NvdW50IDANCj4+DQplbmRvYmoNCg0KMyAwIG9iag0KPDwNCi9UeXBlIC9QYWdlcw0KL0NvdW50IDINCi9LaWRzIFsgNCAwIFIgNiAwIFIgXSANCj4+DQplbmRvYmoNCg0KNCAwIG9iag0KPDwNCi9UeXBlIC9QYWdlDQovUGFyZW50IDMgMCBSDQovUmVzb3VyY2VzIDw8DQovRm9udCA8PA0KL0YxIDkgMCBSIA0KPj4NCi9Qcm9jU2V0IDggMCBSDQo+Pg0KL01lZGlhQm94IFswIDAgNjEyLjAwMDAgNzkyLjAwMDBdDQovQ29udGVudHMgNSAwIFINCj4+DQplbmRvYmoNCg0KNSAwIG9iag0KPDwgL0xlbmd0aCAxMDc0ID4+DQpzdHJlYW0NCjIgSg0KQlQNCjAgMCAwIHJnDQovRjEgMDAyNyBUZg0KNTcuMzc1MCA3MjIuMjgwMCBUZA0KKCBBIFNpbXBsZSBQREYgRmlsZSApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY4OC42MDgwIFRkDQooIFRoaXMgaXMgYSBzbWFsbCBkZW1vbnN0cmF0aW9uIC5wZGYgZmlsZSAtICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNjY0LjcwNDAgVGQNCigganVzdCBmb3IgdXNlIGluIHRoZSBWaXJ0dWFsIE1lY2hhbmljcyB0dXRvcmlhbHMuIE1vcmUgdGV4dC4gQW5kIG1vcmUgKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA2NTIuNzUyMCBUZA0KKCB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDYyOC44NDgwIFRkDQooIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNjE2Ljg5NjAgVGQNCiggdGV4dC4gQW5kIG1vcmUgdGV4dC4gQm9yaW5nLCB6enp6ei4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNjA0Ljk0NDAgVGQNCiggbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDU5Mi45OTIwIFRkDQooIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNTY5LjA4ODAgVGQNCiggQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA1NTcuMTM2MCBUZA0KKCB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBFdmVuIG1vcmUuIENvbnRpbnVlZCBvbiBwYWdlIDIgLi4uKSBUag0KRVQNCmVuZHN0cmVhbQ0KZW5kb2JqDQoNCjYgMCBvYmoNCjw8DQovVHlwZSAvUGFnZQ0KL1BhcmVudCAzIDAgUg0KL1Jlc291cmNlcyA8PA0KL0ZvbnQgPDwNCi9GMSA5IDAgUiANCj4+DQovUHJvY1NldCA4IDAgUg0KPj4NCi9NZWRpYUJveCBbMCAwIDYxMi4wMDAwIDc5Mi4wMDAwXQ0KL0NvbnRlbnRzIDcgMCBSDQo+Pg0KZW5kb2JqDQoNCjcgMCBvYmoNCjw8IC9MZW5ndGggNjc2ID4+DQpzdHJlYW0NCjIgSg0KQlQNCjAgMCAwIHJnDQovRjEgMDAyNyBUZg0KNTcuMzc1MCA3MjIuMjgwMCBUZA0KKCBTaW1wbGUgUERGIEZpbGUgMiApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY4OC42MDgwIFRkDQooIC4uLmNvbnRpbnVlZCBmcm9tIHBhZ2UgMS4gWWV0IG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA2NzYuNjU2MCBUZA0KKCBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY2NC43MDQwIFRkDQooIHRleHQuIE9oLCBob3cgYm9yaW5nIHR5cGluZyB0aGlzIHN0dWZmLiBCdXQgbm90IGFzIGJvcmluZyBhcyB3YXRjaGluZyApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY1Mi43NTIwIFRkDQooIHBhaW50IGRyeS4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA2NDAuODAwMCBUZA0KKCBCb3JpbmcuICBNb3JlLCBhIGxpdHRsZSBtb3JlIHRleHQuIFRoZSBlbmQsIGFuZCBqdXN0IGFzIHdlbGwuICkgVGoNCkVUDQplbmRzdHJlYW0NCmVuZG9iag0KDQo4IDAgb2JqDQpbL1BERiAvVGV4dF0NCmVuZG9iag0KDQo5IDAgb2JqDQo8PA0KL1R5cGUgL0ZvbnQNCi9TdWJ0eXBlIC9UeXBlMQ0KL05hbWUgL0YxDQovQmFzZUZvbnQgL0hlbHZldGljYQ0KL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcNCj4+DQplbmRvYmoNCg0KMTAgMCBvYmoNCjw8DQovQ3JlYXRvciAoUmF2ZSBcKGh0dHA6Ly93d3cubmV2cm9uYS5jb20vcmF2ZVwpKQ0KL1Byb2R1Y2VyIChOZXZyb25hIERlc2lnbnMpDQovQ3JlYXRpb25EYXRlIChEOjIwMDYwMzAxMDcyODI2KQ0KPj4NCmVuZG9iag0KDQp4cmVmDQowIDExDQowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDAwMTkgMDAwMDAgbg0KMDAwMDAwMDA5MyAwMDAwMCBuDQowMDAwMDAwMTQ3IDAwMDAwIG4NCjAwMDAwMDAyMjIgMDAwMDAgbg0KMDAwMDAwMDM5MCAwMDAwMCBuDQowMDAwMDAxNTIyIDAwMDAwIG4NCjAwMDAwMDE2OTAgMDAwMDAgbg0KMDAwMDAwMjQyMyAwMDAwMCBuDQowMDAwMDAyNDU2IDAwMDAwIG4NCjAwMDAwMDI1NzQgMDAwMDAgbg0KDQp0cmFpbGVyDQo8PA0KL1NpemUgMTENCi9Sb290IDEgMCBSDQovSW5mbyAxMCAwIFINCj4+DQoNCnN0YXJ0eHJlZg0KMjcxNA0KJSVFT0YNCg==',
              }),
            },
          ],
        });

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
    });

    it('should return HTTP 403 if the file type is not allowed', async () => {
      // Arrange
      // Act
      const result = await chai
        .request(apiAddress)
        .post('/admin/questionnaireInstances/1234567/answers')
        .set(utHeader)
        .send({
          answers: [
            {
              question_id: 12345,
              answer_option_id: 12345,
              value: JSON.stringify({
                file_name: 'file.gif',
                data: 'data:image/gif;base64,R0lGODlhHAAVAPcAAP////8k2OKJ1s3MzPYJzPcAzMzLy8vKysrJycjIyMjHx8TDw8LBwcDAwL+/v7y7u7u7u8lwurW1tbS0tLCwsMoMqs4AqaWlpbZBoaCgoJ2dnZiYmJeXl5KSkrACko6OjplOjIeHh4SEhIKCgn9/f5wAf3Nzc3JycooAcnFxcW1tbWpqamZmZnAIXl1dXVtbW1paWmAAT0xMTFoASUVFRUoAPTw8PC0tLScnJyEhIRoaGhgYGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAMgAAP8CAv+AgP+zswAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAAAALAAAAAAcABUAAAjBAAEIHEiwoMGDCBMqXMiwocOGU6ZIkTLl4UGJESNKsUgQY0aJUSpypDiFCpWSUaJA4QiApMYpKleOpDgxZUyWMG2mhAIligoVJDZIgKgzJhQqLJKyEMFwwYApPKP2VKp0aMIGBh6wgMozClKqSZkmTIBAxg4HaB2YAKtU7EGnJ3TASOvgA9ukVg02OJAhhw0IaCdoGLGCrVuDChjcwHFBQ4gULFKE4NCBxM+gCgfQ0OEicggNE1gCYLHjBWjRqBkGBAA7',
              }),
            },
          ],
        });

      // Assert
      expect(result).to.have.status(403);
    });
  });

  describe('POST /questionnaireInstances/{id}/answers', function () {
    it('should return HTTP 403 if the role is not allowed to upload an allowed type', async () => {
      // Arrange
      // Act
      const result = await chai
        .request(apiAddress)
        .post('/questionnaireInstances/1234567/answers')
        .set(probandHeader1)
        .send({
          answers: [
            {
              question_id: 12345,
              answer_option_id: 12345,
              value: JSON.stringify({
                file_name: 'file.pdf',
                data: 'data:application/pdf;base64,JVBERi0xLjMNCiXi48/TDQoNCjEgMCBvYmoNCjw8DQovVHlwZSAvQ2F0YWxvZw0KL091dGxpbmVzIDIgMCBSDQovUGFnZXMgMyAwIFINCj4+DQplbmRvYmoNCg0KMiAwIG9iag0KPDwNCi9UeXBlIC9PdXRsaW5lcw0KL0NvdW50IDANCj4+DQplbmRvYmoNCg0KMyAwIG9iag0KPDwNCi9UeXBlIC9QYWdlcw0KL0NvdW50IDINCi9LaWRzIFsgNCAwIFIgNiAwIFIgXSANCj4+DQplbmRvYmoNCg0KNCAwIG9iag0KPDwNCi9UeXBlIC9QYWdlDQovUGFyZW50IDMgMCBSDQovUmVzb3VyY2VzIDw8DQovRm9udCA8PA0KL0YxIDkgMCBSIA0KPj4NCi9Qcm9jU2V0IDggMCBSDQo+Pg0KL01lZGlhQm94IFswIDAgNjEyLjAwMDAgNzkyLjAwMDBdDQovQ29udGVudHMgNSAwIFINCj4+DQplbmRvYmoNCg0KNSAwIG9iag0KPDwgL0xlbmd0aCAxMDc0ID4+DQpzdHJlYW0NCjIgSg0KQlQNCjAgMCAwIHJnDQovRjEgMDAyNyBUZg0KNTcuMzc1MCA3MjIuMjgwMCBUZA0KKCBBIFNpbXBsZSBQREYgRmlsZSApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY4OC42MDgwIFRkDQooIFRoaXMgaXMgYSBzbWFsbCBkZW1vbnN0cmF0aW9uIC5wZGYgZmlsZSAtICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNjY0LjcwNDAgVGQNCigganVzdCBmb3IgdXNlIGluIHRoZSBWaXJ0dWFsIE1lY2hhbmljcyB0dXRvcmlhbHMuIE1vcmUgdGV4dC4gQW5kIG1vcmUgKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA2NTIuNzUyMCBUZA0KKCB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDYyOC44NDgwIFRkDQooIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNjE2Ljg5NjAgVGQNCiggdGV4dC4gQW5kIG1vcmUgdGV4dC4gQm9yaW5nLCB6enp6ei4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNjA0Ljk0NDAgVGQNCiggbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDU5Mi45OTIwIFRkDQooIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNTY5LjA4ODAgVGQNCiggQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA1NTcuMTM2MCBUZA0KKCB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBFdmVuIG1vcmUuIENvbnRpbnVlZCBvbiBwYWdlIDIgLi4uKSBUag0KRVQNCmVuZHN0cmVhbQ0KZW5kb2JqDQoNCjYgMCBvYmoNCjw8DQovVHlwZSAvUGFnZQ0KL1BhcmVudCAzIDAgUg0KL1Jlc291cmNlcyA8PA0KL0ZvbnQgPDwNCi9GMSA5IDAgUiANCj4+DQovUHJvY1NldCA4IDAgUg0KPj4NCi9NZWRpYUJveCBbMCAwIDYxMi4wMDAwIDc5Mi4wMDAwXQ0KL0NvbnRlbnRzIDcgMCBSDQo+Pg0KZW5kb2JqDQoNCjcgMCBvYmoNCjw8IC9MZW5ndGggNjc2ID4+DQpzdHJlYW0NCjIgSg0KQlQNCjAgMCAwIHJnDQovRjEgMDAyNyBUZg0KNTcuMzc1MCA3MjIuMjgwMCBUZA0KKCBTaW1wbGUgUERGIEZpbGUgMiApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY4OC42MDgwIFRkDQooIC4uLmNvbnRpbnVlZCBmcm9tIHBhZ2UgMS4gWWV0IG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA2NzYuNjU2MCBUZA0KKCBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY2NC43MDQwIFRkDQooIHRleHQuIE9oLCBob3cgYm9yaW5nIHR5cGluZyB0aGlzIHN0dWZmLiBCdXQgbm90IGFzIGJvcmluZyBhcyB3YXRjaGluZyApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY1Mi43NTIwIFRkDQooIHBhaW50IGRyeS4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA2NDAuODAwMCBUZA0KKCBCb3JpbmcuICBNb3JlLCBhIGxpdHRsZSBtb3JlIHRleHQuIFRoZSBlbmQsIGFuZCBqdXN0IGFzIHdlbGwuICkgVGoNCkVUDQplbmRzdHJlYW0NCmVuZG9iag0KDQo4IDAgb2JqDQpbL1BERiAvVGV4dF0NCmVuZG9iag0KDQo5IDAgb2JqDQo8PA0KL1R5cGUgL0ZvbnQNCi9TdWJ0eXBlIC9UeXBlMQ0KL05hbWUgL0YxDQovQmFzZUZvbnQgL0hlbHZldGljYQ0KL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcNCj4+DQplbmRvYmoNCg0KMTAgMCBvYmoNCjw8DQovQ3JlYXRvciAoUmF2ZSBcKGh0dHA6Ly93d3cubmV2cm9uYS5jb20vcmF2ZVwpKQ0KL1Byb2R1Y2VyIChOZXZyb25hIERlc2lnbnMpDQovQ3JlYXRpb25EYXRlIChEOjIwMDYwMzAxMDcyODI2KQ0KPj4NCmVuZG9iag0KDQp4cmVmDQowIDExDQowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDAwMTkgMDAwMDAgbg0KMDAwMDAwMDA5MyAwMDAwMCBuDQowMDAwMDAwMTQ3IDAwMDAwIG4NCjAwMDAwMDAyMjIgMDAwMDAgbg0KMDAwMDAwMDM5MCAwMDAwMCBuDQowMDAwMDAxNTIyIDAwMDAwIG4NCjAwMDAwMDE2OTAgMDAwMDAgbg0KMDAwMDAwMjQyMyAwMDAwMCBuDQowMDAwMDAyNDU2IDAwMDAwIG4NCjAwMDAwMDI1NzQgMDAwMDAgbg0KDQp0cmFpbGVyDQo8PA0KL1NpemUgMTENCi9Sb290IDEgMCBSDQovSW5mbyAxMCAwIFINCj4+DQoNCnN0YXJ0eHJlZg0KMjcxNA0KJSVFT0YNCg==',
              }),
            },
          ],
        });

      // Assert
      expect(result).to.have.status(403);
    });
  });
});
