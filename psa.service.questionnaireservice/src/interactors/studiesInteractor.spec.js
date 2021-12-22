/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const expect = require('chai').expect;
const sinon = require('sinon');

const pgHelper = require('../services/postgresqlHelper');

const { StudiesInteractor } = require('./studiesInteractor');

describe('studiesInteractor', function () {
  const sandbox = sinon.createSandbox();
  let pgHelperMock;

  beforeEach(() => {
    pgHelperMock = sandbox.stub(pgHelper);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('#getStudy', function () {
    it('should not get the study, if the user has unknown role', async function () {
      pgHelperMock.getStudy.resolves(null);

      const session = {
        id: 1,
        role: 'NoValidRole',
        username: 'Testproband',
        groups: ['Study1'],
      };
      await StudiesInteractor.getStudy(session, 'Study1')
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getStudy.callCount).to.equal(0);
        });
    });

    it('should not get the study, if the user has role "Proband" but is not assigned to the study', async function () {
      pgHelperMock.getStudy.resolves(null);

      const session = {
        id: 1,
        role: 'Proband',
        username: 'Testproband',
        groups: ['Study2'],
      };
      await StudiesInteractor.getStudy(session, 'Study1')
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getStudy.callCount).to.equal(0);
        });
    });

    it('should not get the study, if the user has role "Forscher" but is not assigned to the study', async function () {
      pgHelperMock.getStudy.resolves(null);

      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['Study2'],
      };
      await StudiesInteractor.getStudy(session, 'Study1')
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getStudy.callCount).to.equal(0);
        });
    });

    it('should reject, if the study does not exist for SysAdmin', async function () {
      pgHelperMock.getStudy.withArgs('Study1').rejects();

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      await StudiesInteractor.getStudy(session, 'Study1')
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getStudy.calledOnce).to.equal(true);
        });
    });

    it('should get the study, if the user has role "Proband" and is in the study', async function () {
      pgHelperMock.getStudy.withArgs('Study1').resolves({ id: 'Study1' });

      const session = {
        id: 1,
        role: 'Proband',
        username: 'Testproband',
        groups: ['Study1'],
      };
      await StudiesInteractor.getStudy(session, 'Study1').then((result) => {
        expect(pgHelperMock.getStudy.calledOnce).to.equal(true);
        expect(result.id).to.equal('Study1');
      });
    });

    it('should get the study, if the user has role "Forscher" and has access to the study', async function () {
      pgHelperMock.getStudy.withArgs('Study1').resolves({ id: 'Study1' });

      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['Study1'],
      };
      await StudiesInteractor.getStudy(session, 'Study1').then((result) => {
        expect(pgHelperMock.getStudy.calledOnce).to.equal(true);
        expect(result.id).to.equal('Study1');
      });
    });

    it('should get the study, if the user has role Untersuchungsteam and has access to the study', async function () {
      pgHelperMock.getStudy.withArgs('Study1').resolves({ id: 'Study1' });

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'Testuntersuchungsteam',
        groups: ['Study1'],
      };
      await StudiesInteractor.getStudy(session, 'Study1').then((result) => {
        expect(pgHelperMock.getStudy.calledOnce).to.equal(true);
        expect(result.id).to.equal('Study1');
      });
    });

    it('should get the study, if the user has role Sysadmin', async function () {
      pgHelperMock.getStudy.withArgs('Study1').resolves({ id: 'Study1' });

      const session = {
        id: 1,
        role: 'SysAdmin',
        username: 'Testsysadmin',
        groups: ['Study1'],
      };
      await StudiesInteractor.getStudy(session, 'Study1').then((result) => {
        expect(pgHelperMock.getStudy.calledOnce).to.equal(true);
        expect(result.id).to.equal('Study1');
      });
    });
  });

  describe('#getStudies', function () {
    it('should not get studies, if the user has unknown role', async function () {
      pgHelperMock.getStudiesByStudyIds.resolves(null);

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      await StudiesInteractor.getStudies(session)
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getStudiesByStudyIds.calledOnce).to.equal(false);
        });
    });

    it('should only get studies that the user is assigned to', async function () {
      pgHelperMock.getStudiesByStudyIds
        .withArgs(['AStudyId'])
        .resolves([{ id: 'AStudyId' }]);
      pgHelperMock.getStudiesByStudyIds
        .withArgs(['AStudyId1', 'AStudyId2'])
        .resolves([{ study_id: 'AStudyId1' }, { study_id: 'AStudyId2' }]);

      const session = {
        id: 1,
        role: 'Forscher',
        username: 'Testforscher',
        groups: ['AStudyId1', 'AStudyId2'],
      };
      await StudiesInteractor.getStudies(session).then((result) => {
        expect(pgHelperMock.getStudiesByStudyIds.calledOnce).to.equal(true);
        expect(result.length).to.equal(2);
        expect(result[0].study_id).to.equal('AStudyId1');
        expect(result[1].study_id).to.equal('AStudyId2');
      });
    });

    it('should get all studies for SysAdmin', async function () {
      pgHelperMock.getStudies.resolves([{ id: 998 }, { id: 999 }]);

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      await StudiesInteractor.getStudies(session).then((result) => {
        expect(pgHelperMock.getStudies.calledOnce).to.equal(true);
        expect(result.length).to.equal(2);
        expect(result[0].id).to.equal(998);
        expect(result[1].id).to.equal(999);
      });
    });
  });

  describe('#createStudy', function () {
    it('should not create the study, if the user has unknown role', async function () {
      pgHelperMock.createStudy.resolves(null);

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      await StudiesInteractor.createStudy(session, { name: 'TestStudie' })
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.createStudy.callCount).to.equal(0);
        });
    });

    it('should not create the study, if the user is a Proband', async function () {
      pgHelperMock.createStudy.resolves(null);

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await StudiesInteractor.createStudy(session, { name: 'TestStudie' })
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.createStudy.callCount).to.equal(0);
        });
    });

    it('should not create the study, if the user is a Forscher', async function () {
      pgHelperMock.createStudy.resolves(null);

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await StudiesInteractor.createStudy(session, { name: 'TestStudie' })
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.createStudy.callCount).to.equal(0);
        });
    });

    it('should not create the study, if the user is a Untersuchungsteam', async function () {
      pgHelperMock.createStudy.resolves(null);

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'TestUntersuchungsteam',
      };
      await StudiesInteractor.createStudy(session, { name: 'TestStudie' })
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.createStudy.callCount).to.equal(0);
        });
    });

    it('should not create the study, if the user is a ProbandenManager', async function () {
      pgHelperMock.createStudy.resolves(null);

      const session = {
        id: 1,
        role: 'ProbandenManager',
        username: 'TestProbandenManager',
      };
      await StudiesInteractor.createStudy(session, { name: 'TestStudie' })
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.createStudy.callCount).to.equal(0);
        });
    });

    it('should create the study, if the user is a Sysadmin', async function () {
      pgHelperMock.createStudy.resolves({ id: 1, name: 'TestStudie' });

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      await StudiesInteractor.createStudy(session, { name: 'TestStudie' }).then(
        (result) => {
          expect(pgHelperMock.createStudy.callCount).to.equal(1);
          expect(result.name).to.equal('TestStudie');
        }
      );
    });
  });

  describe('#updateStudy', function () {
    it('should not update the study, if the user has unknown role', async function () {
      // Arrange
      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };

      // Act
      try {
        await StudiesInteractor.updateStudy(session, 1, {
          name: 'TestStudie',
        });
        expect(true).to.be.false; // should never execute
      } catch (error) {
        // Assert
        expect(error.message).to.eql(
          'Could not update study: Unknown or wrong role'
        );
      }
    });

    it('should not update the study, if the user is a Proband', async function () {
      // Arrange
      const session = { id: 1, role: 'Proband', username: 'Testproband' };

      // Act
      try {
        await StudiesInteractor.updateStudy(session, 1, {
          name: 'TestStudie',
        });
        expect(true).to.be.false; // should never execute
      } catch (error) {
        // Assert
        expect(error.message).to.eql(
          'Could not update study: Unknown or wrong role'
        );
      }
    });

    it('should not update the study, if the user is a Untersuchungsteam', async function () {
      // Arrange
      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'TestUntersuchungsteam',
      };

      // Act
      try {
        await StudiesInteractor.updateStudy(session, 1, {
          name: 'TestStudie',
        });
        expect(true).to.be.false; // should never execute
      } catch (error) {
        // Assert
        expect(error.message).to.eql(
          'Could not update study: Unknown or wrong role'
        );
      }
    });

    it('should not update the study, if the user is a ProbandenManager', async function () {
      // Arrange
      const session = {
        id: 1,
        role: 'ProbandenManager',
        username: 'TestProbandenManager',
      };

      // Act
      try {
        await StudiesInteractor.updateStudy(session, 1, {
          name: 'TestStudie',
        });
        expect(true).to.be.false; // should never execute
      } catch (error) {
        // Assert
        expect(error.message).to.eql(
          'Could not update study: Unknown or wrong role'
        );
      }
    });

    it('should not update the study, if the user is a Forscher', async function () {
      // Arrange
      const session = {
        id: 1,
        role: 'Forscher',
        username: 'TestForscher',
      };

      // Act
      try {
        await StudiesInteractor.updateStudy(session, 1, {
          name: 'TestStudie',
        });
        expect(true).to.be.false; // should never execute
      } catch (error) {
        // Assert
        expect(error.message).to.eql(
          'Could not update study: Unknown or wrong role'
        );
      }
    });

    it('should update the study, if the user is a SysAdmin', async function () {
      // Arrange
      const session = { id: 1, role: 'SysAdmin', username: 'TestSysAdmin' };
      pgHelperMock.updateStudyAsAdmin.resolves({ name: 'TestStudie' });

      // Act
      const result = await StudiesInteractor.updateStudy(session, 1, {
        name: 'TestStudie',
      });

      // Assert
      expect(result).not.to.be.undefined;
      expect(result.name).to.equal('TestStudie');
    });
  });
});
