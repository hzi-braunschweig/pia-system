/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const sinon = require('sinon');
const expect = require('chai').expect;

const pgHelper = require('../services/postgresqlHelper');

const { StudyAccessesInteractor } = require('./studyAccessesInteractor');

describe('studyAccessesInteractor', function () {
  const sandbox = sinon.createSandbox();
  let pgHelperMock;

  beforeEach(() => {
    pgHelperMock = sandbox.stub(pgHelper);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('#deleteStudyAccess', function () {
    it('should not delete the study access, if the user has unknown role', async function () {
      pgHelperMock.getRoleOfUser.resolves();
      pgHelperMock.deleteStudyAccess.resolves();

      const session = {
        id: 1,
        role: 'NoValidRole',
        username: 'Testuntersuchungsteam',
      };
      await StudyAccessesInteractor.deleteStudyAccess(
        session,
        'AStudyName',
        'Testproband'
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.deleteStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not delete the study access, if the user is a Proband', async function () {
      pgHelperMock.getRoleOfUser.resolves();
      pgHelperMock.deleteStudyAccess.resolves();

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await StudyAccessesInteractor.deleteStudyAccess(
        session,
        'AStudyName',
        'Testproband'
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.deleteStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not delete the study access, if the user is a Forscher', async function () {
      pgHelperMock.getRoleOfUser.resolves();
      pgHelperMock.deleteStudyAccess.resolves();

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await StudyAccessesInteractor.deleteStudyAccess(
        session,
        'AStudyName',
        'Testproband'
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.deleteStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not delete the study access, if the user is a ProbandenManager', async function () {
      pgHelperMock.getRoleOfUser.resolves();
      pgHelperMock.deleteStudyAccess.resolves();

      const session = {
        id: 1,
        role: 'ProbandenManager',
        username: 'TestProbandenManager',
      };
      await StudyAccessesInteractor.deleteStudyAccess(
        session,
        'AStudyName',
        'Testproband'
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.deleteStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not delete the study access, if the user is a Untersuchungsteam without study access', async function () {
      pgHelperMock.getRoleOfUser.resolves();
      pgHelperMock.deleteStudyAccess.resolves();

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'TestUntersuchungsteam',
      };
      await StudyAccessesInteractor.deleteStudyAccess(
        session,
        'AStudyName',
        'Testproband'
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.deleteStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not delete the study access, if the user is a Untersuchungsteam with read study access', async function () {
      pgHelperMock.getRoleOfUser.resolves();
      pgHelperMock.deleteStudyAccess.resolves();

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'TestUntersuchungsteam',
      };
      await StudyAccessesInteractor.deleteStudyAccess(
        session,
        'AStudyName',
        'Testproband'
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.deleteStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not delete the study access, if the user is a Untersuchungsteam with write study access and tries for Forscher', async function () {
      pgHelperMock.getRoleOfUser.resolves('Forscher');
      pgHelperMock.deleteStudyAccess.resolves();

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'TestUntersuchungsteam',
      };
      await StudyAccessesInteractor.deleteStudyAccess(
        session,
        'AStudyName',
        'Testproband'
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.deleteStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not delete the study access, if the user is a SysAdmin and tries for Proband', async function () {
      pgHelperMock.getRoleOfUser.resolves('Proband');
      pgHelperMock.deleteStudyAccess.resolves();

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      await StudyAccessesInteractor.deleteStudyAccess(
        session,
        'AStudyName',
        'Testproband'
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(1);
          expect(pgHelperMock.deleteStudyAccess.callCount).to.equal(0);
        });
    });

    it('should delete the study access, if the user is a SysAdmin and tries for Forscher', async function () {
      pgHelperMock.getRoleOfUser.resolves('Forscher');
      pgHelperMock.deleteStudyAccess.resolves({ access_level: 'read' });

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      await StudyAccessesInteractor.deleteStudyAccess(
        session,
        'AStudyName',
        'Testproband'
      ).then((result) => {
        expect(pgHelperMock.getRoleOfUser.callCount).to.equal(1);
        expect(pgHelperMock.deleteStudyAccess.callCount).to.equal(1);
        expect(result.access_level).to.equal('read');
      });
    });
  });

  describe('#createStudyAccess', function () {
    it('should not create the study access, if the user has unknown role', async function () {
      pgHelperMock.getRoleOfUser.resolves();
      pgHelperMock.createStudyAccess.resolves();

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      await StudyAccessesInteractor.createStudyAccess(
        session,
        'AStudyName',
        { user_id: 'Testproband', access_level: 'read' },
        pgHelperMock
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not create the study access, if the user is a Proband', async function () {
      pgHelperMock.getRoleOfUser.resolves();
      pgHelperMock.createStudyAccess.resolves();

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await StudyAccessesInteractor.createStudyAccess(
        session,
        'AStudyName',
        { user_id: 'Testproband', access_level: 'read' },
        pgHelperMock
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not create the study access, if the user is a Forscher', async function () {
      pgHelperMock.getRoleOfUser.resolves();
      pgHelperMock.createStudyAccess.resolves();

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await StudyAccessesInteractor.createStudyAccess(
        session,
        'AStudyName',
        { user_id: 'Testproband', access_level: 'read' },
        pgHelperMock
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not create the study access, if the user is a ProbandenManager', async function () {
      pgHelperMock.getRoleOfUser.resolves();
      pgHelperMock.createStudyAccess.resolves();

      const session = {
        id: 1,
        role: 'ProbandenManager',
        username: 'TestProbandenManager',
      };
      await StudyAccessesInteractor.createStudyAccess(
        session,
        'AStudyName',
        { user_id: 'Testproband', access_level: 'read' },
        pgHelperMock
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not create the study access with Untersuchungsteam, if a Proband gets access_level write', async function () {
      pgHelperMock.getRoleOfUser.resolves('Proband');
      pgHelperMock.createStudyAccess.resolves();

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'Testuntersuchungsteam',
      };
      await StudyAccessesInteractor.createStudyAccess(
        session,
        'AStudyName',
        { user_id: 'Testproband', access_level: 'write' },
        pgHelperMock
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not create the study access with Untersuchungsteam, if he tries for Forscher', async function () {
      pgHelperMock.getRoleOfUser.resolves('Forscher');
      pgHelperMock.createStudyAccess.resolves();

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'Testuntersuchungsteam',
      };
      await StudyAccessesInteractor.createStudyAccess(session, 'AStudyName', {
        user_id: 'Testforscher',
        access_level: 'write',
      })
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not create the study access with Untersuchungsteam, if he has no study access', async function () {
      pgHelperMock.getRoleOfUser.resolves('Proband');
      pgHelperMock.createStudyAccess.resolves();

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'Testuntersuchungsteam',
      };
      await StudyAccessesInteractor.createStudyAccess(session, 'AStudyName', {
        user_id: 'Testproband',
        access_level: 'read',
      })
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not create the study access with Untersuchungsteam, if he has read study access', async function () {
      pgHelperMock.getRoleOfUser.resolves('Proband');
      pgHelperMock.createStudyAccess.resolves();

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'Testuntersuchungsteam',
      };
      await StudyAccessesInteractor.createStudyAccess(session, 'AStudyName', {
        user_id: 'Testproband',
        access_level: 'read',
      })
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not create the study access with SysAdmin, if he tries for Proband', async function () {
      pgHelperMock.getRoleOfUser.resolves('Proband');
      pgHelperMock.createStudyAccess.resolves();

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      await StudyAccessesInteractor.createStudyAccess(session, 'AStudyName', {
        user_id: 'Testproband',
        access_level: 'read',
      })
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(1);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not create the study access with SysAdmin, if he tries for SysAdmin', async function () {
      pgHelperMock.getRoleOfUser.resolves('SysAdmin');
      pgHelperMock.createStudyAccess.resolves();

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      await StudyAccessesInteractor.createStudyAccess(session, 'AStudyName', {
        user_id: 'TestSysAdmin',
        access_level: 'admin',
      })
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(1);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not create the study access for Untersuchungsteam', async function () {
      pgHelperMock.getRoleOfUser.resolves('Proband');
      pgHelperMock.createStudyAccess.resolves({ access_level: 'read' });

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'Testuntersuchungsteam',
      };
      await StudyAccessesInteractor.createStudyAccess(session, 'AStudyName', {
        user_id: 'Testproband',
        access_level: 'read',
      })
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.createStudyAccess.callCount).to.equal(0);
        });
    });

    it('should create the study access for SysAdmin', async function () {
      pgHelperMock.getRoleOfUser.resolves('Forscher');
      pgHelperMock.createStudyAccess.resolves({ access_level: 'read' });

      const session = {
        id: 1,
        role: 'SysAdmin',
        username: 'SysAdminTestsysadmin',
      };
      await StudyAccessesInteractor.createStudyAccess(session, 'AStudyName', {
        user_id: 'Testproband',
        access_level: 'read',
      }).then((result) => {
        expect(pgHelperMock.getRoleOfUser.callCount).to.equal(1);
        expect(pgHelperMock.createStudyAccess.callCount).to.equal(1);
        expect(result.access_level).to.equal('read');
      });
    });
  });

  describe('#updateStudyAccess', function () {
    it('should not update the study access, if the user has unknown role', async function () {
      pgHelperMock.getRoleOfUser.resolves();
      pgHelperMock.updateStudyAccess.resolves();

      const session = { id: 1, role: 'NoValidRole', username: 'Testproband' };
      await StudyAccessesInteractor.updateStudyAccess(
        session,
        'AStudyName',
        'Testproband',
        { access_level: 'read' }
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.updateStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not update the study access, if the user is a Proband', async function () {
      pgHelperMock.getRoleOfUser.resolves();
      pgHelperMock.updateStudyAccess.resolves();

      const session = { id: 1, role: 'Proband', username: 'Testproband' };
      await StudyAccessesInteractor.updateStudyAccess(
        session,
        'AStudyName',
        'Testproband',
        { access_level: 'read' }
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.updateStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not update the study access, if the user is a Forscher', async function () {
      pgHelperMock.getRoleOfUser.resolves();
      pgHelperMock.updateStudyAccess.resolves();

      const session = { id: 1, role: 'Forscher', username: 'Testforscher' };
      await StudyAccessesInteractor.updateStudyAccess(
        session,
        'AStudyName',
        'Testproband',
        { access_level: 'read' }
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.updateStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not update the study access, if the user is a Untersuchungsteam', async function () {
      pgHelperMock.getRoleOfUser.resolves();
      pgHelperMock.updateStudyAccess.resolves();

      const session = {
        id: 1,
        role: 'Untersuchungsteam',
        username: 'TestUntersuchungsteam',
      };
      await StudyAccessesInteractor.updateStudyAccess(
        session,
        'AStudyName',
        'Testproband',
        { access_level: 'read' }
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.updateStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not update the study access, if the user is a ProbandenManager', async function () {
      pgHelperMock.getRoleOfUser.resolves();
      pgHelperMock.updateStudyAccess.resolves();

      const session = {
        id: 1,
        role: 'ProbandenManager',
        username: 'TestProbandenManager',
      };
      await StudyAccessesInteractor.updateStudyAccess(
        session,
        'AStudyName',
        'Testproband',
        { access_level: 'read' }
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(0);
          expect(pgHelperMock.updateStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not update the study access, if a SysAdmin tries for a Proband', async function () {
      pgHelperMock.getRoleOfUser.resolves('Proband');
      pgHelperMock.updateStudyAccess.resolves();

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      await StudyAccessesInteractor.updateStudyAccess(
        session,
        'AStudyName',
        'Testproband',
        { access_level: 'read' }
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(1);
          expect(pgHelperMock.updateStudyAccess.callCount).to.equal(0);
        });
    });

    it('should not update the study access, if a SysAdmin tries for a SysAdmin', async function () {
      pgHelperMock.getRoleOfUser.resolves('SysAdmin');
      pgHelperMock.updateStudyAccess.resolves();

      const session = { id: 1, role: 'SysAdmin', username: 'Testsysadmin' };
      await StudyAccessesInteractor.updateStudyAccess(
        session,
        'AStudyName',
        'Testsysadmin',
        { access_level: 'admin' }
      )
        .then(() => {
          throw new Error();
        })
        .catch(() => {
          expect(pgHelperMock.getRoleOfUser.callCount).to.equal(1);
          expect(pgHelperMock.updateStudyAccess.callCount).to.equal(0);
        });
    });

    it('should update the study access, if a SysAdmin tries for Forscher', async function () {
      pgHelperMock.getRoleOfUser.resolves('Forscher');
      pgHelperMock.updateStudyAccess.resolves({ access_level: 'read' });

      const session = { id: 1, role: 'SysAdmin', username: 'TestSysAdmin' };
      await StudyAccessesInteractor.updateStudyAccess(
        session,
        'AStudyName',
        'Testproband',
        { access_level: 'read' }
      ).then((result) => {
        expect(pgHelperMock.getRoleOfUser.callCount).to.equal(1);
        expect(pgHelperMock.updateStudyAccess.callCount).to.equal(1);
        expect(result.access_level).to.equal('read');
      });
    });
  });
});
