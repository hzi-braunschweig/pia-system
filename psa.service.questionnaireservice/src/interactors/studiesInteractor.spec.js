const expect = require('chai').expect;
const sinon = require('sinon');

const studiesInteractor = require('./studiesInteractor');

describe('studiesInteractor', function () {
  describe('#getStudy', function () {
    it('should not get the study, if the user has unknown role', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves({ access_level: 'read' }),
        getStudy: sinon.stub().resolves(null),
      };

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      await studiesInteractor
        .getStudy(session, 1, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(pgHelperMock.getStudy.callCount).to.equal(0);
        });
    });

    it('should not get the study, if the user has role "Proband" but is not assigned to the study', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon
          .stub()
          .withArgs(1, 'Testproband')
          .rejects(),
        getStudy: sinon.stub().resolves(null),
      };

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await studiesInteractor
        .getStudy(session, 1, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(1);
          expect(pgHelperMock.getStudy.callCount).to.equal(0);
        });
    });

    it('should not get the study, if the user has role "Forscher" but is not assigned to the study', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon
          .stub()
          .withArgs(1, 'Testforscher')
          .rejects(),
        getStudy: sinon.stub().resolves(null),
      };

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await studiesInteractor
        .getStudy(session, 1, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(1);
          expect(pgHelperMock.getStudy.callCount).to.equal(0);
        });
    });

    it('should reject, if the study does not exist for SysAdmin', async function () {
      const pgHelperMock = {
        getStudy: sinon.stub().withArgs(1).rejects('error'),
      };

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      await studiesInteractor
        .getStudy(session, 1, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudy.calledOnce).to.equal(true);
        });
    });

    it('should get the study, if the user has role "Proband" and has read access in study', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon
          .stub()
          .withArgs(1, 'Testproband')
          .resolves({ access_level: 'read' }),
        getStudy: sinon.stub().withArgs(1).resolves({ id: 1 }),
      };

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await studiesInteractor
        .getStudy(session, 1, pgHelperMock)
        .then((result) => {
          expect(pgHelperMock.getStudy.calledOnce).to.equal(true);
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(true);
          expect(result.id).to.equal(1);
        });
    });

    it('should get the study, if the user has role "Forscher" and has read access in study', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon
          .stub()
          .withArgs(1, 'Testforscher')
          .resolves({ access_level: 'read' }),
        getStudy: sinon.stub().withArgs(1).resolves({ id: 1 }),
      };

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await studiesInteractor
        .getStudy(session, 1, pgHelperMock)
        .then((result) => {
          expect(pgHelperMock.getStudy.calledOnce).to.equal(true);
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(true);
          expect(result.id).to.equal(1);
        });
    });

    it('should get the study, if the user has role Untersuchungsteam and has write access in study', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon
          .stub()
          .withArgs(1, 'Testuntersuchungsteam')
          .resolves({ access_level: 'write' }),
        getStudy: sinon.stub().withArgs(1).resolves({ id: 1 }),
      };

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'Testuntersuchungsteam',
      };
      await studiesInteractor
        .getStudy(session, 1, pgHelperMock)
        .then((result) => {
          expect(pgHelperMock.getStudyAccessForUser.calledOnce).to.equal(true);
          expect(pgHelperMock.getStudy.calledOnce).to.equal(true);
          expect(result.id).to.equal(1);
        });
    });

    it('should get the study, if the user has role Sysadmin', async function () {
      const pgHelperMock = {
        getStudy: sinon.stub().withArgs(1).resolves({ id: 1 }),
      };

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      await studiesInteractor
        .getStudy(session, 1, pgHelperMock)
        .then((result) => {
          expect(pgHelperMock.getStudy.calledOnce).to.equal(true);
          expect(result.id).to.equal(1);
        });
    });
  });

  describe('#getStudies', function () {
    it('should not get studies, if the user has unknown role', async function () {
      const pgHelperMock = {
        getStudyAccessesForUser: sinon
          .stub()
          .resolves({ study_id: 'AStudyId' }),
        getStudiesByStudyIds: sinon.stub().resolves(null),
      };

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      await studiesInteractor
        .getStudies(session, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessesForUser.calledOnce).to.equal(
            false
          );
          expect(pgHelperMock.getStudiesByStudyIds.calledOnce).to.equal(false);
        });
    });

    it('should only get studies that the user is assigned to', async function () {
      const getStudiesByStudyIdsMock = sinon.stub();
      getStudiesByStudyIdsMock
        .withArgs(['AStudyId'])
        .resolves([{ id: 'AStudyId' }]);
      getStudiesByStudyIdsMock
        .withArgs(['AStudyId1', 'AStudyId2'])
        .resolves([{ study_id: 'AStudyId1' }, { study_id: 'AStudyId2' }]);

      const pgHelperMock = {
        getStudyAccessesForUser: sinon
          .stub()
          .withArgs('Forscher')
          .resolves([{ study_id: 'AStudyId1' }, { study_id: 'AStudyId2' }]),
        getStudiesByStudyIds: getStudiesByStudyIdsMock,
      };

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await studiesInteractor
        .getStudies(session, pgHelperMock)
        .then((result) => {
          expect(pgHelperMock.getStudyAccessesForUser.calledOnce).to.equal(
            true
          );
          expect(pgHelperMock.getStudiesByStudyIds.calledOnce).to.equal(true);
          expect(result.length).to.equal(2);
          expect(result[0].study_id).to.equal('AStudyId1');
          expect(result[1].study_id).to.equal('AStudyId2');
        });
    });

    it('should get all studies for SysAdmin', async function () {
      const pgHelperMock = {
        getStudies: sinon.stub().resolves([{ id: 998 }, { id: 999 }]),
      };

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      await studiesInteractor
        .getStudies(session, pgHelperMock)
        .then((result) => {
          expect(pgHelperMock.getStudies.calledOnce).to.equal(true);
          expect(result.length).to.equal(2);
          expect(result[0].id).to.equal(998);
          expect(result[1].id).to.equal(999);
        });
    });
  });

  describe('#createStudy', function () {
    it('should not create the study, if the user has unknown role', async function () {
      const pgHelperMock = {
        createStudy: sinon.stub().resolves(null),
      };

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      await studiesInteractor
        .createStudy(session, { name: 'TestStudie' }, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.createStudy.callCount).to.equal(0);
        });
    });

    it('should not create the study, if the user is a Proband', async function () {
      const pgHelperMock = {
        createStudy: sinon.stub().resolves(null),
      };

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await studiesInteractor
        .createStudy(session, { name: 'TestStudie' }, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.createStudy.callCount).to.equal(0);
        });
    });

    it('should not create the study, if the user is a Forscher', async function () {
      const pgHelperMock = {
        createStudy: sinon.stub().resolves(null),
      };

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await studiesInteractor
        .createStudy(session, { name: 'TestStudie' }, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.createStudy.callCount).to.equal(0);
        });
    });

    it('should not create the study, if the user is a Untersuchungsteam', async function () {
      const pgHelperMock = {
        createStudy: sinon.stub().resolves(null),
      };

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'TestUntersuchungsteam',
      };
      await studiesInteractor
        .createStudy(session, { name: 'TestStudie' }, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.createStudy.callCount).to.equal(0);
        });
    });

    it('should not create the study, if the user is a ProbandenManager', async function () {
      const pgHelperMock = {
        createStudy: sinon.stub().resolves(null),
      };

      const session = {
        id: 1,
        role: 'ProbandenManager',
        username: 'TestProbandenManager',
      };
      await studiesInteractor
        .createStudy(session, { name: 'TestStudie' }, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.createStudy.callCount).to.equal(0);
        });
    });

    it('should create the study, if the user is a Sysadmin', async function () {
      const pgHelperMock = {
        createStudy: sinon.stub().resolves({ id: 1, name: 'TestStudie' }),
      };

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      await studiesInteractor
        .createStudy(session, { name: 'TestStudie' }, pgHelperMock)
        .then((result) => {
          expect(pgHelperMock.createStudy.callCount).to.equal(1);
          expect(result.name).to.equal('TestStudie');
        });
    });
  });

  describe('#updateStudy', function () {
    it('should not update the study, if the user has unknown role', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().rejects(),
        updateStudy: sinon.stub().resolves(null),
      };

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      await studiesInteractor
        .updateStudy(session, 1, { name: 'TestStudie' }, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(pgHelperMock.updateStudy.callCount).to.equal(0);
        });
    });

    it('should not update the study, if the user is a Proband', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().rejects(),
        updateStudy: sinon.stub().resolves(null),
      };

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await studiesInteractor
        .updateStudy(session, 1, { name: 'TestStudie' }, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(pgHelperMock.updateStudy.callCount).to.equal(0);
        });
    });

    it('should not update the study, if the user is a Untersuchungsteam', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().rejects(),
        updateStudy: sinon.stub().resolves(null),
      };

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'TestUntersuchungsteam',
      };
      await studiesInteractor
        .updateStudy(session, 1, { name: 'TestStudie' }, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(pgHelperMock.updateStudy.callCount).to.equal(0);
        });
    });

    it('should not update the study, if the user is a ProbandenManager', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().rejects(),
        updateStudy: sinon.stub().resolves(null),
      };

      const session = {
        id: 1,
        role: 'ProbandenManager',
        username: 'TestProbandenManager',
      };
      await studiesInteractor
        .updateStudy(session, 1, { name: 'TestStudie' }, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(pgHelperMock.updateStudy.callCount).to.equal(0);
        });
    });

    it.skip('should not update the study, if the user is a SysAdmin', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().rejects(),
        updateStudy: sinon.stub().resolves(null),
      };

      const session = { id: 1, role: 'SysAdmin', username: 'TestSysAdmin' };
      await studiesInteractor
        .updateStudy(session, 1, { name: 'TestStudie' }, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(0);
          expect(pgHelperMock.updateStudy.callCount).to.equal(0);
        });
    });

    it.skip('should not update the study, if the user is a Forscher without admin access', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves({ access_level: 'write' }),
        updateStudy: sinon.stub().resolves({ id: 1, name: 'TestStudie' }),
      };

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await studiesInteractor
        .updateStudy(session, 1, { name: 'TestStudie' }, pgHelperMock)
        .then()
        .catch(() => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(1);
          expect(pgHelperMock.updateStudy.callCount).to.equal(0);
        });
    });

    it.skip('should update the study, if the user is a Forscher with admin access', async function () {
      const pgHelperMock = {
        getStudyAccessForUser: sinon.stub().resolves({ access_level: 'admin' }),
        updateStudy: sinon.stub().resolves({ id: 1, name: 'TestStudie' }),
      };

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await studiesInteractor
        .updateStudy(session, 1, { name: 'TestStudie' }, pgHelperMock)
        .then((result) => {
          expect(pgHelperMock.getStudyAccessForUser.callCount).to.equal(1);
          expect(pgHelperMock.updateStudy.callCount).to.equal(1);
          expect(result.name).to.equal('TestStudie');
        });
    });
  });
});
