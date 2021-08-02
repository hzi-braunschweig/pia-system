/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const sinon = require('sinon');
const expect = require('chai').expect;

const studyAccessesInteractor = require('./studyAccessesInteractor');

describe('studyAccessesInteractor', function () {
  describe('#getStudyAccess', function () {
    it('should not get the study access, if the user has unknown role', async function () {
      const pgHelperMock = {
        getUser: sinon.stub().resolves(),
        getStudyAccessForUser: sinon.stub().resolves({ access_level: 'read' }),
      };

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      studyAccessesInteractor
        .getStudyAccess(session, 'AStudyName', 'AUserName', pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
        });
    });

    it('should not get the study access, if the user has role "Proband"', async function () {
      const pgHelperMock = {
        getUser: sinon.stub().resolves({ role: 'Proband' }),
        getStudyAccessForUser: sinon.stub().resolves({ access_level: 'read' }),
      };

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      studyAccessesInteractor
        .getStudyAccess(session, 'AStudyName', 'AUserName', pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
        });
    });

    it('should not get the study access, if the user has role "Forscher" ', async function () {
      const pgHelperMock = {
        getUser: sinon.stub().resolves({ role: 'Proband' }),
        getStudyAccessForUser: sinon.stub().resolves(),
      };

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      studyAccessesInteractor
        .getStudyAccess(session, 'AStudyName', 'Testproband', pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
        });
    });

    it('should not get the study access, if the user has role "ProbandenManager" ', async function () {
      const pgHelperMock = {
        getUser: sinon.stub().resolves({ role: 'Proband' }),
        getStudyAccessForUser: sinon.stub().resolves(),
      };

      const session = {
        id: 1,
        role: 'ProbandenManager',
        username: 'Testprobandenmanager',
      };
      studyAccessesInteractor
        .getStudyAccess(session, 'AStudyName', 'Testproband', pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
        });
    });

    it('should not get the study access, if the user has role "Untersuchungsteam" and requests for a Forscher ', async function () {
      const pgHelperMock = {
        getUser: sinon.stub().resolves({ role: 'Forscher' }),
        getStudyAccessForUser: sinon.stub().resolves(),
      };

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'Testuntersuchungsteam',
      };
      studyAccessesInteractor
        .getStudyAccess(session, 'AStudyName', 'Testproband', pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getUser.callCount).to.equal(1);
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
        });
    });

    it('should not get the study access, if the user has role "SysAdmin" and requests for a Proband ', async function () {
      const pgHelperMock = {
        getUser: sinon.stub().resolves({ role: 'Proband' }),
        getStudyAccessForUser: sinon.stub().resolves(),
      };

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      studyAccessesInteractor
        .getStudyAccess(session, 'AStudyName', 'Testproband', pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getUser.callCount).to.equal(1);
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
        });
    });

    it('should get the study access, if the user has role "Untersuchungsteam" and is assigned to the study', async function () {
      const getStudyAccessForUserStub = sinon.stub();
      getStudyAccessForUserStub.onCall(0).resolves({ access_level: 'read' });
      getStudyAccessForUserStub.onCall(1).resolves({ access_level: 'read' });

      const pgHelperMock = {
        getUser: sinon.stub().resolves({ role: 'Proband' }),
        getStudyAccessForUser: getStudyAccessForUserStub,
      };

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'Testuntersuchungsteam',
      };
      studyAccessesInteractor
        .getStudyAccess(session, 'AStudyName', 'Testproband', pgHelperMock)
        .then(function (result) {
          expect(pgHelperMock.getUser.callCount).to.equal(1);
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(2);
          expect(result.access_level).to.equal('read');
        });
    });

    it('should get the study access, if the user has role "SysAdmin" and requests a Forscher', async function () {
      const getStudyAccessForUserStub = sinon.stub();
      getStudyAccessForUserStub.onCall(0).resolves({ access_level: 'write' });

      const pgHelperMock = {
        getUser: sinon.stub().resolves({ role: 'Forscher' }),
        getStudyAccessForUser: getStudyAccessForUserStub,
      };

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      studyAccessesInteractor
        .getStudyAccess(session, 'AStudyName', 'Testproband', pgHelperMock)
        .then(function (result) {
          expect(pgHelperMock.getUser.callCount).to.equal(1);
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(1);
          expect(result.access_level).to.equal('write');
        });
    });
  });

  describe('#getStudyAccesses', function () {
    it('should not get study accesses, if the user has unknown role', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves({ study_id: 'AStudyId' }),
        getProbandStudyAccessesForStudy: sinon.stub().resolves([]),
        getProfessionalsStudyAccessesForStudy: sinon.stub().resolves([]),
      };

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      studyAccessesInteractor
        .getStudyAccesses(session, 'AStudyName', pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(
            pgHelperMock.getProbandStudyAccessesForStudy.callCount
          ).to.equal(0);
          expect(
            pgHelperMock.getProfessionalsStudyAccessesForStudy.callCount
          ).to.equal(0);
        });
    });

    it('should not get study accesses, if a Forscher tries', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves(),
        getProbandStudyAccessesForStudy: sinon.stub().resolves([]),
        getProfessionalsStudyAccessesForStudy: sinon.stub().resolves([]),
      };

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      studyAccessesInteractor
        .getStudyAccesses(session, 'AStudyName', pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(
            pgHelperMock.getProbandStudyAccessesForStudy.callCount
          ).to.equal(0);
          expect(
            pgHelperMock.getProfessionalsStudyAccessesForStudy.callCount
          ).to.equal(0);
        });
    });

    it('should not get study accesses, if a ProbandenManager tries', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves(),
        getProbandStudyAccessesForStudy: sinon.stub().resolves([]),
        getProfessionalsStudyAccessesForStudy: sinon.stub().resolves([]),
      };

      const session = {
        id: 1,
        role: 'ProbandenManager',
        username: 'TestProbandenManager',
      };
      studyAccessesInteractor
        .getStudyAccesses(session, 'AStudyName', pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(
            pgHelperMock.getProbandStudyAccessesForStudy.callCount
          ).to.equal(0);
          expect(
            pgHelperMock.getProfessionalsStudyAccessesForStudy.callCount
          ).to.equal(0);
        });
    });

    it('should not get study accesses, if a Untersuchungsteam tries without study access', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().rejects(),
        getProbandStudyAccessesForStudy: sinon.stub().resolves([]),
        getProfessionalsStudyAccessesForStudy: sinon.stub().resolves([]),
      };

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'Testuntersuchungsteam',
      };
      studyAccessesInteractor
        .getStudyAccesses(session, 'AStudyName', pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(1);
          expect(
            pgHelperMock.getProbandStudyAccessesForStudy.callCount
          ).to.equal(0);
          expect(
            pgHelperMock.getProfessionalsStudyAccessesForStudy.callCount
          ).to.equal(0);
        });
    });

    it('should get study accesses, if a Untersuchungsteam tries with study access', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves({ access_level: 'write' }),
        getProbandStudyAccessesForStudy: sinon
          .stub()
          .resolves([{ access_level: 'read' }]),
        getProfessionalsStudyAccessesForStudy: sinon.stub().resolves([]),
      };

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'TestUntersuchungsteam',
      };
      studyAccessesInteractor
        .getStudyAccesses(session, 'AStudyName', pgHelperMock)
        .then((result) => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(1);
          expect(
            pgHelperMock.getProbandStudyAccessesForStudy.callCount
          ).to.equal(1);
          expect(
            pgHelperMock.getProfessionalsStudyAccessesForStudy.callCount
          ).to.equal(0);
          expect(result.length).to.equal(1);
          expect(result[0].access_level).to.equal('read');
        });
    });

    it('should get all Professionals study accesses for SysAdmin', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves({ access_level: 'write' }),
        getProbandStudyAccessesForStudy: sinon.stub().resolves([]),
        getProfessionalsStudyAccessesForStudy: sinon
          .stub()
          .resolves([{ access_level: 'read' }]),
      };

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      studyAccessesInteractor
        .getStudyAccesses(session, 'AStudyName', pgHelperMock)
        .then((result) => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(
            pgHelperMock.getProbandStudyAccessesForStudy.callCount
          ).to.equal(0);
          expect(
            pgHelperMock.getProfessionalsStudyAccessesForStudy.callCount
          ).to.equal(1);
          expect(result.length).to.equal(1);
          expect(result[0].access_level).to.equal('read');
        });
    });
  });

  describe('#deleteStudyAccess', function () {
    it('should not delete the study access, if the user has unknown role', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves(),
        getUser: sinon.stub().resolves(),
        deleteStudyAccess: sinon.stub().resolves(),
      };

      const session = {
        id: 1,
        role: 'NoValidRole',
        username: 'Testuntersuchungsteam',
      };
      studyAccessesInteractor
        .deleteStudyAccess(session, 'AStudyName', 'Testproband', pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.deleteStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not delete the study access, if the user is a Proband', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves(),
        getUser: sinon.stub().resolves(),
        deleteStudyAccess: sinon.stub().resolves(),
      };

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      studyAccessesInteractor
        .deleteStudyAccess(session, 'AStudyName', 'Testproband', pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.deleteStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not delete the study access, if the user is a Forscher', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves(),
        getUser: sinon.stub().resolves(),
        deleteStudyAccess: sinon.stub().resolves(),
      };

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      studyAccessesInteractor
        .deleteStudyAccess(session, 'AStudyName', 'Testproband', pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.deleteStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not delete the study access, if the user is a ProbandenManager', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves(),
        getUser: sinon.stub().resolves(),
        deleteStudyAccess: sinon.stub().resolves(),
      };

      const session = {
        id: 1,
        role: 'ProbandenManager',
        username: 'TestProbandenManager',
      };
      studyAccessesInteractor
        .deleteStudyAccess(session, 'AStudyName', 'Testproband', pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.deleteStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not delete the study access, if the user is a Untersuchungsteam without study access', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().rejects(),
        getUser: sinon.stub().resolves(),
        deleteStudyAccess: sinon.stub().resolves(),
      };

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'TestUntersuchungsteam',
      };
      studyAccessesInteractor
        .deleteStudyAccess(session, 'AStudyName', 'Testproband', pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(1);
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.deleteStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not delete the study access, if the user is a Untersuchungsteam with read study access', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves({ access_level: 'read' }),
        getUser: sinon.stub().resolves(),
        deleteStudyAccess: sinon.stub().resolves(),
      };

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'TestUntersuchungsteam',
      };
      studyAccessesInteractor
        .deleteStudyAccess(session, 'AStudyName', 'Testproband', pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(1);
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.deleteStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not delete the study access, if the user is a Untersuchungsteam with write study access and tries for Forscher', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves({ access_level: 'write' }),
        getUser: sinon.stub().resolves({ role: 'Forscher' }),
        deleteStudyAccess: sinon.stub().resolves(),
      };

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'TestUntersuchungsteam',
      };
      studyAccessesInteractor
        .deleteStudyAccess(session, 'AStudyName', 'Testproband', pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(1);
          expect(pgHelperMock.getUser.callCount).to.equal(1);
          expect(pgHelperMock.deleteStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not delete the study access, if the user is a SysAdmin and tries for Proband', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves(),
        getUser: sinon.stub().resolves({ role: 'Proband' }),
        deleteStudyAccess: sinon.stub().resolves(),
      };

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      studyAccessesInteractor
        .deleteStudyAccess(session, 'AStudyName', 'Testproband', pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(pgHelperMock.getUser.callCount).to.equal(1);
          expect(pgHelperMock.deleteStudyAccess.callCount).to.equal(0);
        });
    });

    it.skip('should delete the study access, if the user is a Untersuchungsteam with write study access and tries for PRoband', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves({ access_level: 'write' }),
        getUser: sinon.stub().resolves({ role: 'Proband' }),
        deleteStudyAccess: sinon.stub().resolves({ access_level: 'read' }),
      };

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'Testuntersuchungsteam',
      };
      studyAccessesInteractor
        .deleteStudyAccess(session, 'AStudyName', 'Testproband', pgHelperMock)
        .then((result) => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(1);
          expect(pgHelperMock.getUser.callCount).to.equal(1);
          expect(pgHelperMock.deleteStudyAccess.callCount).to.equal(1);
          expect(result.access_level).to.equal('read');
        });
    });

    it('should delete the study access, if the user is a SysAdmin and tries for Forscher', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves(),
        getUser: sinon.stub().resolves({ role: 'Forscher' }),
        deleteStudyAccess: sinon.stub().resolves({ access_level: 'read' }),
      };

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      studyAccessesInteractor
        .deleteStudyAccess(session, 'AStudyName', 'Testproband', pgHelperMock)
        .then((result) => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(pgHelperMock.getUser.callCount).to.equal(1);
          expect(pgHelperMock.deleteStudyAccess.callCount).to.equal(1);
          expect(result.access_level).to.equal('read');
        });
    });
  });

  describe('#createStudyAccess', function () {
    it('should not create the study access, if the user has unknown role', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves(),
        getUser: sinon.stub().resolves(),
        createStudyAccess: sinon.stub().resolves(),
      };

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      studyAccessesInteractor
        .createStudyAccess(
          session,
          'AStudyName',
          { user_id: 'Testproband', access_level: 'read' },
          pgHelperMock
        )
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not create the study access, if the user is a Proband', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves(),
        getUser: sinon.stub().resolves(),
        createStudyAccess: sinon.stub().resolves(),
      };

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      studyAccessesInteractor
        .createStudyAccess(
          session,
          'AStudyName',
          { user_id: 'Testproband', access_level: 'read' },
          pgHelperMock
        )
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not create the study access, if the user is a Forscher', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves(),
        getUser: sinon.stub().resolves(),
        createStudyAccess: sinon.stub().resolves(),
      };

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      studyAccessesInteractor
        .createStudyAccess(
          session,
          'AStudyName',
          { user_id: 'Testproband', access_level: 'read' },
          pgHelperMock
        )
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not create the study access, if the user is a ProbandenManager', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves(),
        getUser: sinon.stub().resolves(),
        createStudyAccess: sinon.stub().resolves(),
      };

      const session = {
        id: 1,
        role: 'ProbandenManager',
        username: 'TestProbandenManager',
      };
      studyAccessesInteractor
        .createStudyAccess(
          session,
          'AStudyName',
          { user_id: 'Testproband', access_level: 'read' },
          pgHelperMock
        )
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not create the study access with Untersuchungsteam, if a Proband gets access_level write', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves({ access_level: 'write' }),
        getUser: sinon.stub().resolves({ role: 'Proband' }),
        createStudyAccess: sinon.stub().resolves(),
      };

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'Testuntersuchungsteam',
      };
      studyAccessesInteractor
        .createStudyAccess(
          session,
          'AStudyName',
          { user_id: 'Testproband', access_level: 'write' },
          pgHelperMock
        )
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(1);
          expect(pgHelperMock.getUser.callCount).to.equal(1);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not create the study access with Untersuchungsteam, if he tries for Forscher', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves({ access_level: 'write' }),
        getUser: sinon.stub().resolves({ role: 'Forscher' }),
        createStudyAccess: sinon.stub().resolves(),
      };

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'Testuntersuchungsteam',
      };
      studyAccessesInteractor
        .createStudyAccess(
          session,
          'AStudyName',
          { user_id: 'Testforscher', access_level: 'write' },
          pgHelperMock
        )
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(1);
          expect(pgHelperMock.getUser.callCount).to.equal(1);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not create the study access with Untersuchungsteam, if he has no study access', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().rejects(),
        getUser: sinon.stub().resolves({ role: 'Proband' }),
        createStudyAccess: sinon.stub().resolves(),
      };

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'Testuntersuchungsteam',
      };
      studyAccessesInteractor
        .createStudyAccess(
          session,
          'AStudyName',
          { user_id: 'Testproband', access_level: 'read' },
          pgHelperMock
        )
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(1);
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not create the study access with Untersuchungsteam, if he has read study access', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves({ access_level: 'read' }),
        getUser: sinon.stub().resolves({ role: 'Proband' }),
        createStudyAccess: sinon.stub().resolves(),
      };

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'Testuntersuchungsteam',
      };
      studyAccessesInteractor
        .createStudyAccess(
          session,
          'AStudyName',
          { user_id: 'Testproband', access_level: 'read' },
          pgHelperMock
        )
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(1);
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not create the study access with SysAdmin, if he tries for Proband', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves(),
        getUser: sinon.stub().resolves({ role: 'Proband' }),
        createStudyAccess: sinon.stub().resolves(),
      };

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      studyAccessesInteractor
        .createStudyAccess(
          session,
          'AStudyName',
          { user_id: 'Testproband', access_level: 'read' },
          pgHelperMock
        )
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(pgHelperMock.getUser.callCount).to.equal(1);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not create the study access with SysAdmin, if he tries for SysAdmin', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves(),
        getUser: sinon.stub().resolves({ role: 'SysAdmin' }),
        createStudyAccess: sinon.stub().resolves(),
      };

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      studyAccessesInteractor
        .createStudyAccess(
          session,
          'AStudyName',
          { user_id: 'TestSysAdmin', access_level: 'admin' },
          pgHelperMock
        )
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(pgHelperMock.getUser.callCount).to.equal(1);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should create the study access for Untersuchungsteam', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves({ access_level: 'write' }),
        getUser: sinon.stub().resolves({ role: 'Proband' }),
        createStudyAccess: sinon.stub().resolves({ access_level: 'read' }),
      };

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'Testuntersuchungsteam',
      };
      studyAccessesInteractor
        .createStudyAccess(
          session,
          'AStudyName',
          { user_id: 'Testproband', access_level: 'read' },
          pgHelperMock
        )
        .then((result) => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(1);
          expect(pgHelperMock.getUser.callCount).to.equal(1);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(1);
          expect(result.access_level).to.equal('read');
        });
    });

    it('should create the study access for SysAdmin', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves({ access_level: 'write' }),
        getUser: sinon.stub().resolves({ role: 'Forscher' }),
        createStudyAccess: sinon.stub().resolves({ access_level: 'read' }),
      };

      const session = {
        id: 1,
        role: 'SysAdmin',
        username: 'SysAdminTestsysadmin',
      };
      studyAccessesInteractor
        .createStudyAccess(
          session,
          'AStudyName',
          { user_id: 'Testproband', access_level: 'read' },
          pgHelperMock
        )
        .then((result) => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(pgHelperMock.getUser.callCount).to.equal(1);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(1);
          expect(result.access_level).to.equal('read');
        });
    });
  });

  describe('#updateStudyAccess', function () {
    it('should not update the study access, if the user has unknown role', async function () {
      const pgHelperMock = {
        getUser: sinon.stub().resolves(),
        updateStudyAccess: sinon.stub().resolves(),
      };

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      studyAccessesInteractor
        .updateStudyAccess(
          session,
          'AStudyName',
          'Testproband',
          { access_level: 'read' },
          pgHelperMock
        )
        .then()
        .catch(() => {
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.updateStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not update the study access, if the user is a Proband', async function () {
      const pgHelperMock = {
        getUser: sinon.stub().resolves(),
        updateStudyAccess: sinon.stub().resolves(),
      };

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      studyAccessesInteractor
        .updateStudyAccess(
          session,
          'AStudyName',
          'Testproband',
          { access_level: 'read' },
          pgHelperMock
        )
        .then()
        .catch(() => {
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.updateStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not update the study access, if the user is a Forscher', async function () {
      const pgHelperMock = {
        getUser: sinon.stub().resolves(),
        updateStudyAccess: sinon.stub().resolves(),
      };

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      studyAccessesInteractor
        .updateStudyAccess(
          session,
          'AStudyName',
          'Testproband',
          { access_level: 'read' },
          pgHelperMock
        )
        .then()
        .catch(() => {
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.updateStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not update the study access, if the user is a Untersuchungsteam', async function () {
      const pgHelperMock = {
        getUser: sinon.stub().resolves(),
        updateStudyAccess: sinon.stub().resolves(),
      };

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'TestUntersuchungsteam',
      };
      studyAccessesInteractor
        .updateStudyAccess(
          session,
          'AStudyName',
          'Testproband',
          { access_level: 'read' },
          pgHelperMock
        )
        .then()
        .catch(() => {
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.updateStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not update the study access, if the user is a ProbandenManager', async function () {
      const pgHelperMock = {
        getUser: sinon.stub().resolves(),
        updateStudyAccess: sinon.stub().resolves(),
      };

      const session = {
        id: 1,
        role: 'ProbandenManager',
        username: 'TestProbandenManager',
      };
      studyAccessesInteractor
        .updateStudyAccess(
          session,
          'AStudyName',
          'Testproband',
          { access_level: 'read' },
          pgHelperMock
        )
        .then()
        .catch(() => {
          expect(pgHelperMock.getUser.callCount).to.equal(0);
          expect(pgHelperMock.updateStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not update the study access, if a SysAdmin tries for a Proband', async function () {
      const pgHelperMock = {
        getUser: sinon.stub().resolves({ role: 'Proband' }),
        updateStudyAccess: sinon.stub().resolves(),
      };

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      studyAccessesInteractor
        .updateStudyAccess(
          session,
          'AStudyName',
          'Testproband',
          { access_level: 'read' },
          pgHelperMock
        )
        .then()
        .catch(() => {
          expect(pgHelperMock.getUser.callCount).to.equal(1);
          expect(pgHelperMock.updateStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not update the study access, if a SysAdmin tries for a SysAdmin', async function () {
      const pgHelperMock = {
        getUser: sinon.stub().resolves({ role: 'SysAdmin' }),
        updateStudyAccess: sinon.stub().resolves(),
      };

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      studyAccessesInteractor
        .updateStudyAccess(
          session,
          'AStudyName',
          'Testsysadmin',
          { access_level: 'admin' },
          pgHelperMock
        )
        .then()
        .catch(() => {
          expect(pgHelperMock.getUser.callCount).to.equal(1);
          expect(pgHelperMock.updateStudyAccess.callCount).to.equal(0);
        });
    });

    it('should update the study access, if a SysAdmin tries for Forscher', async function () {
      const pgHelperMock = {
        getUser: sinon.stub().resolves({ role: 'Forscher' }),
        updateStudyAccess: sinon.stub().resolves({ access_level: 'read' }),
      };

      const session = { id: 1, role: 'SysAdmin', username: 'TestSysAdmin' };
      studyAccessesInteractor
        .updateStudyAccess(
          session,
          'AStudyName',
          'Testproband',
          { access_level: 'read' },
          pgHelperMock
        )
        .then((result) => {
          expect(pgHelperMock.getUser.callCount).to.equal(1);
          expect(pgHelperMock.updateStudyAccess.callCount).to.equal(1);
          expect(result.access_level).to.equal('read');
        });
    });
  });
});
