const { db, getDbTransactionFromOptionsOrDbConnection } = require('../db');

/**
 * @description helper methods to access db
 */
const postgresqlHelper = (function () {
  function getUser(username) {
    return db.oneOrNone(
      `SELECT username,
                    role,
                    first_logged_in_at,
                    compliance_labresults,
                    account_status,
                    study_status,
                    ids,
                    su.study_accesses
             FROM users AS u
                      LEFT OUTER JOIN (SELECT user_id,
                                              JSON_AGG(
                                                      JSON_BUILD_OBJECT('study_id', study_id, 'access_level', access_level)) AS study_accesses
                                       FROM study_users
                                       GROUP BY user_id) AS su ON u.username = su.user_id
             WHERE LOWER(username) = LOWER($(username));`,
      { username: username }
    );
  }

  function getUserExternalCompliance(username) {
    return db.oneOrNone(
      'SELECT compliance_labresults, compliance_samples, compliance_bloodsamples FROM users WHERE username = $(username)',
      { username }
    );
  }

  /**
   *
   * @param username {string}
   * @return {Promise<boolean>}
   */
  async function isUserExistentByUsername(username) {
    const result = await db.oneOrNone(
      'SELECT 1 FROM users WHERE username = $(username)',
      { username }
    );
    return !!result;
  }

  /**
   *
   * @param ids {string}
   * @return {Promise<boolean>}
   */
  async function isUserExistentByIds(ids) {
    const result = await db.oneOrNone(
      'SELECT 1 FROM users WHERE ids = $(ids)',
      { ids }
    );
    return !!result;
  }

  async function lookupUserIds(username, options) {
    const t = getDbTransactionFromOptionsOrDbConnection(options);
    return t
      .one('SELECT ids FROM users WHERE username = $(username)', { username })
      .then((row) => row.ids);
  }

  async function lookupMappingId(username) {
    return db
      .one('SELECT mapping_id FROM users WHERE username = $(username)', {
        username,
      })
      .then((row) => row.mapping_id);
  }

  function getUserAllData(username) {
    return db.oneOrNone('SELECT * FROM users WHERE username = $(username)', {
      username,
    });
  }

  async function getStudy(study_id) {
    return await db.one('SELECT * FROM studies WHERE name=$1', [study_id]);
  }

  function getUserAsProfessional(username, requesterName) {
    return db
      .one(
        'SELECT username,role,first_logged_in_at, study_center, examination_wave, compliance_samples, compliance_bloodsamples, compliance_labresults, is_test_proband, account_status, study_status, ids, logging_active FROM users WHERE username = $(username) AND username=ANY(SELECT user_id FROM study_users WHERE study_id=ANY(SELECT study_id FROM study_users WHERE user_id = $(requesterName)))',
        { username: username, requesterName: requesterName }
      )
      .then(function (userResult) {
        return db
          .manyOrNone(
            'SELECT study_id,access_level FROM study_users WHERE user_id = $(username) ORDER BY study_id',
            { username: username }
          )
          .then(function (studyAccessResult) {
            userResult.study_accesses = studyAccessResult;
            return userResult;
          });
      });
  }

  function getUserAsProfessionalByIDS(ids, requesterName) {
    return db.oneOrNone(
      'SELECT u.username, u.role, u.first_logged_in_at, u.study_center, u.examination_wave, u.compliance_samples, u.compliance_bloodsamples, u.compliance_labresults, u.is_test_proband, u.account_status, u.study_status, u.ids, u.logging_active ' +
        'FROM users as u ' +
        'JOIN study_users su1 on u.username = su1.user_id ' +
        'JOIN study_users su2 on su1.study_id = su2.study_id AND su2.user_id = $(requesterName) ' +
        'WHERE u.ids = $(ids)',
      { ids, requesterName }
    );
  }

  function getUsersForProfessional(username) {
    const queryString =
      'SELECT username,role,first_logged_in_at,compliance_labresults, needs_material,is_test_proband, account_status, study_status, ids, logging_active FROM users WHERE role=$(role) AND username=ANY(SELECT user_id FROM study_users WHERE study_id=ANY(SELECT study_id FROM study_users WHERE user_id = $(username)))';
    return db
      .manyOrNone(queryString, { role: 'Proband', username: username })
      .then(function (usersResult) {
        return db
          .manyOrNone(
            'SELECT * FROM study_users WHERE study_id=ANY(SELECT study_id FROM study_users WHERE user_id = $(username))',
            { username: username }
          )
          .then(function (studyAccessesResult) {
            usersResult.forEach(function (user) {
              user.study_accesses = [];
              studyAccessesResult.forEach(function (study_access) {
                if (study_access.user_id === user.username) {
                  user.study_accesses.push({
                    study_id: study_access.study_id,
                    access_level: study_access.access_level,
                  });
                }
              });
            });
            return usersResult;
          });
      });
  }

  async function getUsersForPM(username) {
    const queryString =
      'SELECT username,role,first_logged_in_at,compliance_labresults, needs_material, account_status, study_status, compliance_samples, compliance_bloodsamples, ids FROM users WHERE role=$(role) AND username=ANY(SELECT user_id FROM study_users WHERE study_id=ANY(SELECT study_id FROM study_users WHERE user_id = $(username)))';
    const probands = await db.manyOrNone(queryString, {
      role: 'Proband',
      username: username,
    });
    if (probands.length > 0) {
      const pendingComplianceChanges = await db.manyOrNone(
        'SELECT * FROM pending_compliance_changes WHERE proband_id IN($1:csv)',
        [probands.map((proband) => proband.username)]
      );
      const studyAccesses = await db.manyOrNone(
        'SELECT * FROM study_users WHERE study_id=ANY(SELECT study_id FROM study_users WHERE user_id=$(username))',
        { username: username }
      );
      probands.forEach((proband) => {
        const foundCC = pendingComplianceChanges.find((cc) => {
          return cc.proband_id === proband.username;
        });
        if (foundCC) {
          proband.pendingComplianceChange = foundCC;
        }
        proband.study_accesses = [];
        studyAccesses.find(function (study_access) {
          if (study_access.user_id === proband.username) {
            proband.study_accesses.push({
              study_id: study_access.study_id,
              access_level: study_access.access_level,
            });
          }
        });
      });
    }
    return probands;
  }

  function getUsersWithSameRole(username, role) {
    if (role === 'SysAdmin') {
      return db
        .manyOrNone(
          'SELECT username, role FROM users WHERE role=$1 AND username !=$2',
          [role, username]
        )
        .then(function (usersResult) {
          return usersResult;
        });
    } else {
      return db
        .manyOrNone(
          'SELECT username, role FROM users WHERE role=$1 AND username !=$2 AND username IN(SELECT user_id FROM study_users WHERE study_id IN(SELECT study_id FROM study_users WHERE user_id=$2))',
          [role, username]
        )
        .then(async function (usersResult) {
          if (usersResult.length > 0) {
            const userAccesses = await db.manyOrNone(
              'SELECT * FROM study_users WHERE user_id IN($1:csv)',
              [usersResult.map((user) => user.username)]
            );

            usersResult.forEach((user) => {
              user.study_accesses = userAccesses.filter((ua) => {
                return ua.user_id === user.username;
              });
            });
          }
          return usersResult;
        });
    }
  }

  function getUsersForSysAdmin() {
    return db
      .manyOrNone(
        'SELECT username, role, first_logged_in_at FROM users WHERE role IN ($1:csv)',
        [
          [
            'Forscher',
            'Untersuchungsteam',
            'ProbandenManager',
            'EinwilligungsManager',
          ],
        ]
      )
      .then(function (usersResult) {
        return db
          .manyOrNone('SELECT * FROM study_users')
          .then(function (studyAccessesResult) {
            usersResult.forEach(function (user) {
              user.study_accesses = [];
              studyAccessesResult.forEach(function (study_access) {
                if (study_access.user_id === user.username) {
                  user.study_accesses.push({
                    study_id: study_access.study_id,
                    access_level: study_access.access_level,
                  });
                }
              });
            });
            return usersResult;
          });
      });
  }

  async function createSormasProband(user, options) {
    const t = getDbTransactionFromOptionsOrDbConnection(options);
    // Get primary study to use opt-in-logging setting from study for new proband
    const primaryStudy = await getPrimaryStudyFromStudyAccesses(
      user.study_accesses,
      t
    );

    await t.none(
      `UPDATE users SET
          compliance_labresults=$(compliance_labresults), 
          compliance_samples=$(compliance_samples),
          compliance_bloodsamples=$(compliance_bloodsamples), 
          study_center=$(study_center),
          examination_wave=$(examination_wave),
          ids=$(ids)
          ${primaryStudy ? ', logging_active=$(logging_active)' : ''}
        WHERE username=$(username)`,
      {
        username: user.pseudonym,
        compliance_labresults: user.compliance_labresults,
        compliance_samples: user.compliance_samples,
        compliance_bloodsamples: user.compliance_bloodsamples,
        study_center: user.study_center,
        examination_wave: user.examination_wave,
        ids: user.uuid,
        logging_active: primaryStudy
          ? !primaryStudy.has_logging_opt_in
          : undefined,
      }
    );

    await insertStudyAccesses(user.study_accesses, user.pseudonym, t);
  }

  function getPrimaryStudyOfProband(username) {
    return db.one(
      'SELECT s.* FROM studies as s JOIN study_users as su ON s.name = su.study_id WHERE su.user_id = $(username) LIMIT 1',
      { username }
    );
  }

  function getPrimaryStudyFromStudies(studies) {
    return studies.length > 0 ? studies[0] : null;
  }

  async function getPrimaryStudyFromStudyAccesses(study_accesses, t) {
    if (study_accesses && study_accesses.length > 0) {
      const studies = await t.manyOrNone(
        'SELECT * FROM studies WHERE name IN($1:csv)',
        [study_accesses]
      );
      return getPrimaryStudyFromStudies(studies);
    } else {
      return null;
    }
  }

  async function activatePlannedProband(user, requester) {
    return await db.oneOrNone(
      'UPDATE planned_probands SET activated_at=$1 WHERE user_id = $2 AND user_id=ANY(SELECT user_id FROM study_planned_probands WHERE study_id=ANY(SELECT study_id FROM study_users WHERE lower(user_id) = lower($3))) RETURNING *',
      [new Date(), user.pseudonym, requester]
    );
  }

  async function insertStudyAccesses(study_accesses, user_id, t) {
    for (let i = 0; i < (study_accesses || []).length; i++) {
      await t.none('INSERT INTO study_users VALUES($1:csv)', [
        [study_accesses[i], user_id, 'read'],
      ]);
    }
  }

  async function insertStudyAccessesWithAccessLevel(study_accesses, user_id) {
    return await db.tx(async (t) => {
      for (let i = 0; i < (study_accesses || []).length; i++) {
        await t.none('INSERT INTO study_users VALUES($1:csv)', [
          [study_accesses[i].study_id, user_id, study_accesses[i].access_level],
        ]);
      }
    });
  }

  async function createProband(user) {
    return await db.tx(async (t) => {
      let existingAccesses = [];
      let primaryStudy = null;

      if (user.ids) {
        // Existing proband received a pseudonym
        existingAccesses = await t.manyOrNone(
          'SELECT * FROM study_users WHERE user_id=$1',
          [user.pseudonym]
        );
      }

      // Get primary study to use opt-in-logging setting from study for new proband
      // If proband had no studies before -> make sure to use opt-in-logging from new primary study
      if (existingAccesses.length === 0) {
        primaryStudy = await getPrimaryStudyFromStudyAccesses(
          user.study_accesses,
          t
        );
      }

      const proband = await t.one(
        `
        UPDATE users SET 
          compliance_labresults=$(compliance_labresults), 
          compliance_samples=$(compliance_samples),
          compliance_bloodsamples=$(compliance_bloodsamples), 
          study_center=$(study_center),
          examination_wave=$(examination_wave)
          ${primaryStudy ? ', logging_active=$(logging_active)' : ''}
        WHERE username=$(pseudonym) 
        RETURNING username AS pseudonym
        `,
        {
          compliance_labresults: user.compliance_labresults,
          compliance_samples: user.compliance_samples,
          compliance_bloodsamples: user.compliance_bloodsamples,
          study_center: user.study_center,
          examination_wave: user.examination_wave,
          pseudonym: user.pseudonym,
          logging_active: primaryStudy
            ? !primaryStudy.has_logging_opt_in
            : undefined,
        }
      );

      const newStudyAccesses = user.study_accesses.filter(
        (studyAccess) =>
          !existingAccesses.find((ea) => ea.study_id === studyAccess)
      );

      await insertStudyAccesses(newStudyAccesses, user.pseudonym, t);
      return proband;
    });
  }

  async function createIDSProband(user) {
    return await db.tx(async (t) => {
      // Get primary study to use opt-in-logging setting from study for new proband
      const primaryStudy = await getPrimaryStudyFromStudyAccesses(
        user.study_accesses,
        t
      );

      const newProband = await t.one(
        `
        UPDATE users SET 
          username=$(username), 
          ids=$(ids),
          logging_active=$(logging_active)
        WHERE username=$(ids) 
        RETURNING username AS pseudonym
        `,
        {
          username: user.ids,
          ids: user.ids,
          logging_active: primaryStudy
            ? !primaryStudy.has_logging_opt_in
            : true,
        }
      );

      await insertStudyAccesses(user.study_accesses, user.ids, t);
      return newProband;
    });
  }

  function changeTestProbandState(userName, isTestProband, requester) {
    return db.one(
      'UPDATE users set is_test_proband=$1 WHERE username=$2 AND account_status != $3 AND account_status != $4 AND username=ANY(SELECT user_id FROM study_users WHERE study_id=ANY(SELECT study_id FROM study_users WHERE user_id=$5)) RETURNING username',
      [isTestProband, userName, 'deleted', 'deactivated', requester]
    );
  }

  async function deleteProbandData(username, keepUsageData, options) {
    const myDb = getDbTransactionFromOptionsOrDbConnection(options);
    // Check if user is Proband first - throws an error if proband not found
    await myDb.one(
      "SELECT * FROM users WHERE username=$(username) AND role='Proband'",
      { username }
    );
    // Delete users data
    await myDb.none('DELETE FROM user_files WHERE user_id = $(username)', {
      username,
    });
    await myDb.none(
      'DELETE FROM questionnaire_instances_queued WHERE user_id = $(username)',
      { username }
    );
    let deleteQuestionnaireInstancesQuery;
    if (keepUsageData) {
      deleteQuestionnaireInstancesQuery = `DELETE
                                                 FROM questionnaire_instances
                                                 WHERE questionnaire_instances.id IN (
                                                     SELECT questionnaire_instances.id
                                                     FROM questionnaire_instances
                                                              INNER JOIN questionnaires q
                                                                         ON questionnaire_instances.questionnaire_id = q.id
                                                     WHERE questionnaire_instances.user_id = $(username)
                                                       AND q.keep_answers != true
                                                     )`;
    } else {
      deleteQuestionnaireInstancesQuery =
        'DELETE FROM questionnaire_instances WHERE user_id = $(username)';
    }
    await myDb.none(deleteQuestionnaireInstancesQuery, {
      username,
    });
    await myDb.none(
      'DELETE FROM notification_schedules WHERE user_id = $(username)',
      {
        username,
      }
    );
    await myDb.none('DELETE FROM lab_results WHERE user_id = $(username)', {
      username,
    });
    await myDb.none('DELETE FROM blood_samples WHERE user_id = $(username)', {
      username,
    });
    return myDb.one(
      `UPDATE users
             SET password='',
                 fcm_token=null,
                 first_logged_in_at=null,
                 notification_time=null,
                 logged_in_with=null,
                 compliance_labresults=null,
                 compliance_samples=null,
                 needs_material=null,
                 pw_change_needed=null,
                 number_of_wrong_attempts=null,
                 third_wrong_password_at=null,
                 study_center=null,
                 examination_wave=null,
                 compliance_bloodsamples=null,
                 account_status='deactivated',
                 study_status='deleted',
                 logging_active=null,
                 salt=null
             WHERE username = $(username) RETURNING *`,
      { username }
    );
  }

  async function deleteStudyData(study_id, options) {
    const myDb = getDbTransactionFromOptionsOrDbConnection(options);
    // Delete study data
    // Get all probands from study
    const probands = await getStudyProbands(study_id);

    // Get all planned probands from study
    let planned_probands = await myDb.manyOrNone(
      'SELECT p.user_id FROM  study_planned_probands as sp JOIN planned_probands as p ON sp.user_id = p.user_id WHERE study_id=$(study_id)',
      { study_id }
    );
    planned_probands = planned_probands.map((proband) => {
      return proband.user_id;
    });

    // Get all professionel users from study
    let users = await myDb.manyOrNone(
      "SELECT username FROM study_users as su JOIN users as u on su.user_id = u.username WHERE u.role!='Proband' AND su.study_id=$(study_id)",
      { study_id }
    );
    users = users.map((user) => {
      return user.username;
    });

    if (probands && probands.length > 0) {
      await myDb.none('DELETE FROM users WHERE username IN ($(probands:csv))', {
        probands,
      });
    }
    if (planned_probands && planned_probands.length > 0) {
      await myDb.none(
        'DELETE FROM planned_probands WHERE user_id IN ($(planned_probands:csv))',
        {
          planned_probands,
        }
      );
    }
    await myDb.none('DELETE FROM study_users WHERE study_id=$(study_id)', {
      study_id,
    });
    await myDb.none('DELETE FROM questionnaires WHERE study_id=$(study_id)', {
      study_id,
    });
    if (users && users.length > 0) {
      await myDb.none(
        'DELETE FROM pending_deletions WHERE requested_by IN ($(users:csv))',
        { users }
      );
      await myDb.none(
        'DELETE FROM pending_partial_deletions WHERE requested_by IN ($(users:csv))',
        { users }
      );
    }

    return await myDb.one(
      "UPDATE studies SET description=null,pm_email=null,hub_email=null,status='deleted' WHERE name=$(study_id) RETURNING *",
      {
        study_id,
      }
    );
  }

  async function getStudyProbands(studyId) {
    let probands = await db.manyOrNone(
      "SELECT username FROM study_users as su JOIN users as u on su.user_id = u.username WHERE u.role='Proband' AND su.study_id=$(studyId)",
      { studyId }
    );
    probands = probands.map((proband) => {
      return proband.username;
    });
    return probands;
  }

  async function deleteSampleData(id, options) {
    const myDb = getDbTransactionFromOptionsOrDbConnection(options);
    // Delete users data
    await myDb.none(
      'DELETE FROM lab_observations WHERE lab_result_id = $(id)',
      {
        id,
      }
    );
    await myDb.none(
      "DELETE FROM notification_schedules WHERE reference_id=$(id) AND notification_type='sample'",
      { id }
    );
    return await myDb.one(
      `UPDATE lab_results
             SET order_id= null,
                 status=null,
                 remark=null,
                 new_samples_sent=null,
                 performing_doctor=null,
                 dummy_sample_id=null,
                 date_of_sampling=null,
                 study_status='deleted'
             WHERE id = $(id) RETURNING *`,
      { id }
    );
  }

  async function deletePendingDeletion(id, options) {
    const myDb = getDbTransactionFromOptionsOrDbConnection(options);
    await myDb.one('DELETE FROM pending_deletions WHERE id=$(id) RETURNING *', {
      id,
    });
  }

  async function cancelPendingDeletion(id) {
    return await db.tx(async (t) => {
      const pendingDeletion = await t.one(
        'DELETE FROM pending_deletions WHERE id=$1 RETURNING *',
        [id]
      );
      if (pendingDeletion.type === 'proband') {
        await t.none(
          'UPDATE users SET study_status=$1 WHERE username=$2 AND study_status=$3',
          ['active', pendingDeletion.for_id, 'deletion_pending']
        );
      } else if (pendingDeletion.type === 'sample') {
        await t.none(
          'UPDATE lab_results SET study_status=$1 WHERE id=$2 AND study_status=$3',
          ['active', pendingDeletion.for_id, 'deletion_pending']
        );
      } else if (pendingDeletion.type === 'study') {
        await t.none(
          'UPDATE studies SET status=$1 WHERE name=$2 AND status=$3',
          ['active', pendingDeletion.for_id, 'deletion_pending']
        );
      }
      return pendingDeletion;
    });
  }

  async function getPendingDeletion(id) {
    return await db.one('SELECT * FROM pending_deletions WHERE id=$1', [id]);
  }

  async function getPendingDeletionForProbandId(proband_id) {
    return await db.one(
      'SELECT * FROM pending_deletions WHERE for_id=$1 AND type=$2',
      [proband_id, 'proband']
    );
  }

  async function getPendingDeletionForSampleId(sample_id) {
    return await db.one(
      'SELECT * FROM pending_deletions WHERE for_id=$1 AND type=$2',
      [sample_id, 'sample']
    );
  }

  async function getPendingDeletionForStudyId(study_id) {
    return await db.oneOrNone(
      'SELECT * FROM pending_deletions WHERE for_id=$1 AND type=$2',
      [study_id, 'study']
    );
  }

  async function getPendingDeletionForProbandIdIfExisting(proband_id) {
    return await db.oneOrNone(
      'SELECT * FROM pending_deletions WHERE for_id=$1 AND type=$2',
      [proband_id, 'proband']
    );
  }

  async function getPendingDeletionForSampleIdIfExisting(sample_id) {
    return await db.oneOrNone(
      'SELECT * FROM pending_deletions WHERE for_id=$1 AND type=$2',
      [sample_id, 'sample']
    );
  }

  async function getPendingDeletionForStudyIdIfExisting(study_id) {
    return await db.oneOrNone(
      'SELECT * FROM pending_deletions WHERE for_id=$1 AND type=$2',
      [study_id, 'study']
    );
  }

  async function createPendingDeletion(data) {
    return await db.tx(async (t) => {
      const result = await t.one(
        'INSERT INTO pending_deletions(requested_by, requested_for, type, for_id) VALUES($1:csv) RETURNING *',
        [[data.requested_by, data.requested_for, data.type, data.for_id]]
      );
      if (data.type === 'proband') {
        await t.none('UPDATE users SET study_status=$1 WHERE username=$2', [
          'deletion_pending',
          data.for_id,
        ]);
      } else if (data.type === 'sample') {
        await t.none('UPDATE lab_results SET study_status=$1 WHERE id=$2', [
          'deletion_pending',
          data.for_id,
        ]);
      } else if (data.type === 'study') {
        await t.none('UPDATE studies SET status=$1 WHERE name=$2', [
          'deletion_pending',
          data.for_id,
        ]);
      }
      return result;
    });
  }

  async function createPendingComplianceChange(data) {
    const proband = await db.one('SELECT * FROM users WHERE username=$1', [
      data.proband_id,
    ]);
    const compliance_labresults_from = proband.compliance_labresults;
    const compliance_labresults_to =
      data.compliance_labresults_to !== undefined
        ? data.compliance_labresults_to
        : compliance_labresults_from;
    const compliance_samples_from = proband.compliance_samples;
    const compliance_samples_to =
      data.compliance_samples_to !== undefined
        ? data.compliance_samples_to
        : compliance_samples_from;
    const compliance_bloodsamples_from = proband.compliance_bloodsamples;
    const compliance_bloodsamples_to =
      data.compliance_bloodsamples_to !== undefined
        ? data.compliance_bloodsamples_to
        : compliance_bloodsamples_from;
    const string =
      'INSERT INTO pending_compliance_changes(requested_by, requested_for, proband_id, compliance_labresults_from, compliance_labresults_to, compliance_samples_from, compliance_samples_to, compliance_bloodsamples_from, compliance_bloodsamples_to) VALUES($1:csv) RETURNING *';
    const param = [
      [
        data.requested_by,
        data.requested_for,
        data.proband_id,
        compliance_labresults_from,
        compliance_labresults_to,
        compliance_samples_from,
        compliance_samples_to,
        compliance_bloodsamples_from,
        compliance_bloodsamples_to,
      ],
    ];
    return db.one(string, param);
  }

  async function getPendingComplianceChange(id) {
    return await db.one(
      'SELECT * FROM pending_compliance_changes WHERE id=$1',
      [id]
    );
  }

  async function getPendingComplianceChangeForProbandIdIfExisting(proband_id) {
    return await db.oneOrNone(
      'SELECT * FROM pending_compliance_changes WHERE proband_id=$1',
      [proband_id]
    );
  }

  async function deletePendingComplianceChange(id) {
    return await db.one(
      'DELETE FROM pending_compliance_changes WHERE id=$1 RETURNING *',
      [id]
    );
  }

  async function updatePendingComplianceChange(id, options, newCC = null) {
    const myDb = getDbTransactionFromOptionsOrDbConnection(options);
    const cc = newCC
      ? newCC
      : await myDb.one('SELECT * FROM pending_compliance_changes WHERE id=$1', [
          id,
        ]);
    await myDb.none(
      'UPDATE users SET compliance_labresults=$1, compliance_samples=$2, compliance_bloodsamples=$3 WHERE username=$4',
      [
        cc.compliance_labresults_to,
        cc.compliance_samples_to,
        cc.compliance_bloodsamples_to,
        cc.proband_id,
      ]
    );
    if (cc.compliance_samples_to === false) {
      await myDb.manyOrNone(
        'DELETE FROM questionnaire_instances WHERE user_id=$1 AND (status=$2 OR status=$3) AND (questionnaire_id, questionnaire_version) IN (SELECT id, version FROM questionnaires WHERE compliance_needed=$4)',
        [cc.proband_id, 'active', 'inactive', true]
      );
    }
    return newCC
      ? newCC
      : await myDb.one(
          'DELETE FROM pending_compliance_changes WHERE id=$1 RETURNING *',
          [id]
        );
  }

  async function createPendingStudyChange(data) {
    const study = await db.one('SELECT * FROM studies WHERE name=$1', [
      data.study_id,
    ]);

    const description_from = study.description;
    const description_to =
      data.description_to !== undefined
        ? data.description_to
        : description_from;

    const has_rna_samples_from = study.has_rna_samples;
    const has_rna_samples_to =
      data.has_rna_samples_to !== undefined
        ? data.has_rna_samples_to
        : has_rna_samples_from;

    const sample_prefix_from = study.sample_prefix;
    const sample_prefix_to =
      data.sample_prefix_to !== undefined
        ? data.sample_prefix_to
        : sample_prefix_from;

    const sample_suffix_length_from = study.sample_suffix_length;
    const sample_suffix_length_to =
      data.sample_suffix_length_to !== undefined
        ? data.sample_suffix_length_to
        : sample_suffix_length_from;

    const pseudonym_prefix_from = study.pseudonym_prefix;
    const pseudonym_prefix_to =
      data.pseudonym_prefix_to !== undefined
        ? data.pseudonym_prefix_to
        : pseudonym_prefix_from;

    const pseudonym_suffix_length_from = study.pseudonym_suffix_length;
    const pseudonym_suffix_length_to =
      data.pseudonym_suffix_length_to !== undefined
        ? data.pseudonym_suffix_length_to
        : pseudonym_suffix_length_from;

    const has_answers_notify_feature_from = study.has_answers_notify_feature;
    const has_answers_notify_feature_to =
      data.has_answers_notify_feature_to !== undefined
        ? data.has_answers_notify_feature_to
        : has_answers_notify_feature_from;

    const has_answers_notify_feature_by_mail_from =
      study.has_answers_notify_feature_by_mail;
    const has_answers_notify_feature_by_mail_to =
      data.has_answers_notify_feature_by_mail_to !== undefined
        ? data.has_answers_notify_feature_by_mail_to
        : has_answers_notify_feature_by_mail_from;

    const has_four_eyes_opposition_from = study.has_four_eyes_opposition;
    const has_four_eyes_opposition_to =
      data.has_four_eyes_opposition_to !== undefined
        ? data.has_four_eyes_opposition_to
        : has_four_eyes_opposition_from;

    const has_partial_opposition_from = study.has_partial_opposition;
    const has_partial_opposition_to =
      data.has_partial_opposition_to !== undefined
        ? data.has_partial_opposition_to
        : has_partial_opposition_from;

    const has_total_opposition_from = study.has_total_opposition;
    const has_total_opposition_to =
      data.has_total_opposition_to !== undefined
        ? data.has_total_opposition_to
        : has_total_opposition_from;

    const has_compliance_opposition_from = study.has_compliance_opposition;
    const has_compliance_opposition_to =
      data.has_compliance_opposition_to !== undefined
        ? data.has_compliance_opposition_to
        : has_compliance_opposition_from;

    const has_logging_opt_in_from = study.has_logging_opt_in;
    const has_logging_opt_in_to =
      data.has_logging_opt_in_to !== undefined
        ? data.has_logging_opt_in_to
        : has_logging_opt_in_from;

    const string = `INSERT INTO pending_study_changes(requested_by, requested_for, study_id,
                                                          description_from, description_to,
                                                          has_rna_samples_from, has_rna_samples_to,
                                                          sample_prefix_from, sample_prefix_to,
                                                          sample_suffix_length_from, sample_suffix_length_to,
                                                          pseudonym_prefix_from, pseudonym_prefix_to,
                                                          pseudonym_suffix_length_from, pseudonym_suffix_length_to,
                                                          has_answers_notify_feature_from,
                                                          has_answers_notify_feature_to,
                                                          has_answers_notify_feature_by_mail_from,
                                                          has_answers_notify_feature_by_mail_to,
                                                          has_four_eyes_opposition_from, has_four_eyes_opposition_to,
                                                          has_partial_opposition_from, has_partial_opposition_to,
                                                          has_total_opposition_from, has_total_opposition_to,
                                                          has_compliance_opposition_from, has_compliance_opposition_to,
                                                          has_logging_opt_in_from, has_logging_opt_in_to)
                        VALUES ($1:csv) RETURNING *`;

    const param = [
      [
        data.requested_by,
        data.requested_for,
        data.study_id,
        description_from,
        description_to,
        has_rna_samples_from,
        has_rna_samples_to,
        sample_prefix_from,
        sample_prefix_to,
        sample_suffix_length_from,
        sample_suffix_length_to,
        pseudonym_prefix_from,
        pseudonym_prefix_to,
        pseudonym_suffix_length_from,
        pseudonym_suffix_length_to,
        has_answers_notify_feature_from,
        has_answers_notify_feature_to,
        has_answers_notify_feature_by_mail_from,
        has_answers_notify_feature_by_mail_to,
        has_four_eyes_opposition_from,
        has_four_eyes_opposition_to,
        has_partial_opposition_from,
        has_partial_opposition_to,
        has_total_opposition_from,
        has_total_opposition_to,
        has_compliance_opposition_from,
        has_compliance_opposition_to,
        has_logging_opt_in_from,
        has_logging_opt_in_to,
      ],
    ];

    return db.one(string, param);
  }

  async function getPendingStudyChange(id) {
    return await db.one('SELECT * FROM pending_study_changes WHERE id=$1', [
      id,
    ]);
  }

  async function getPendingStudyChangeForStudyIdIfExisting(study_id) {
    return await db.oneOrNone(
      'SELECT * FROM pending_study_changes WHERE study_id=$1',
      [study_id]
    );
  }

  async function deletePendingStudyChange(id) {
    return await db.one(
      'DELETE FROM pending_study_changes WHERE id=$1 RETURNING *',
      [id]
    );
  }

  async function updatePendingStudyChange(id, options) {
    const myDb = getDbTransactionFromOptionsOrDbConnection(options);
    const sc = await myDb.one(
      'SELECT * FROM pending_study_changes WHERE id=$1',
      [id]
    );

    await myDb.none(
      `UPDATE studies
             SET description=$1,
                 has_rna_samples=$2,
                 sample_prefix=$3,
                 sample_suffix_length=$4,
                 pseudonym_prefix=$5,
                 pseudonym_suffix_length=$6,
                 has_answers_notify_feature=$7,
                 has_answers_notify_feature_by_mail=$8,
                 has_four_eyes_opposition=$9,
                 has_partial_opposition=$10,
                 has_total_opposition=$11,
                 has_compliance_opposition=$12,
                 has_logging_opt_in=$13
             WHERE name = $14`,
      [
        sc.description_to,
        sc.has_rna_samples_to,
        sc.sample_prefix_to,
        sc.sample_suffix_length_to,
        sc.pseudonym_prefix_to,
        sc.pseudonym_suffix_length_to,
        sc.has_answers_notify_feature_to,
        sc.has_answers_notify_feature_by_mail_to,
        sc.has_four_eyes_opposition_to,
        sc.has_partial_opposition_to,
        sc.has_total_opposition_to,
        sc.has_compliance_opposition_to,
        sc.has_logging_opt_in_to,
        sc.study_id,
      ]
    );

    return await myDb.one(
      'DELETE FROM pending_study_changes WHERE id=$1 RETURNING *',
      [id]
    );
  }

  function deleteUser(username) {
    return db.tx((t) => {
      return t
        .one('SELECT * FROM users WHERE username=$1 AND role IN ($2:csv)', [
          username,
          [
            'Forscher',
            'Untersuchungsteam',
            'ProbandenManager',
            'EinwilligungsManager',
          ],
        ])
        .then(function () {
          return t
            .none('DELETE FROM study_users WHERE user_id=$(user_id)', {
              user_id: username,
            })
            .then(function () {
              return t
                .one(
                  'DELETE FROM users WHERE username=$(user_id) RETURNING username,role,first_logged_in_at',
                  { user_id: username }
                )
                .then(function (userResult) {
                  return userResult;
                });
            });
        });
    });
  }

  async function updateProbandStatus(user_id, status, requester, options) {
    const myDb = getDbTransactionFromOptionsOrDbConnection(options);
    const studieOfProband = (
      await myDb.many(
        'SELECT * FROM studies WHERE name IN (SELECT study_id FROM study_users WHERE user_id=$1)',
        [user_id]
      )
    )[0];
    let oldStatus;
    switch (status) {
      case 'deactivation_pending':
        oldStatus = 'active';
        break;
      case 'deactivated':
        oldStatus = studieOfProband.has_four_eyes_opposition
          ? 'deactivation_pending'
          : 'active';
        break;
      case 'active':
        oldStatus = 'deactivation_pending';
        break;
    }

    if (status === 'deactivated') {
      await myDb.none(
        'UPDATE users SET password=$1, fcm_token=$2 WHERE username=$3 AND account_status=$4 AND username=ANY(SELECT user_id FROM study_users WHERE study_id=ANY(SELECT study_id FROM study_users WHERE user_id=$5))',
        ['', null, user_id, oldStatus, requester]
      );
    }

    return myDb.one(
      'UPDATE users SET account_status=$1 WHERE username=$2 AND account_status=$3 AND username=ANY(SELECT user_id FROM study_users WHERE study_id=ANY(SELECT study_id FROM study_users WHERE user_id=$4)) RETURNING username, account_status',
      [status, user_id, oldStatus, requester]
    );
  }

  function updateUserSettings(userName, userSettings) {
    return db.one(
      'UPDATE users SET notification_time=$1, logging_active=$2 WHERE username=$3 RETURNING notification_time, logging_active',
      [userSettings.notification_time, userSettings.logging_active, userName]
    );
  }

  function getUserSettings(userName) {
    return db.one(
      'SELECT notification_time, logging_active FROM users WHERE username=$1',
      [userName]
    );
  }

  function getStudyAccessesForUser(userName) {
    return db.many('SELECT * FROM study_users WHERE user_id=$1', [userName]);
  }

  async function getPlannedProbandAsUser(user_id, requester_id) {
    const plannedProband = await db.one(
      'SELECT * FROM planned_probands WHERE user_id=$1 AND user_id IN(SELECT user_id FROM study_planned_probands WHERE study_id IN(SELECT study_id FROM study_users WHERE user_id=$2))',
      [user_id, requester_id]
    );
    plannedProband.study_accesses = await db.manyOrNone(
      'SELECT * FROM study_planned_probands WHERE user_id=$1',
      [user_id]
    );
    return plannedProband;
  }

  async function getPlannedProbandsAsUser(requester_id) {
    const plannedProbands = await db.manyOrNone(
      'SELECT * FROM planned_probands WHERE user_id IN(SELECT user_id FROM study_planned_probands WHERE study_id IN(SELECT study_id FROM study_users WHERE user_id=$1)) ORDER BY user_id',
      [requester_id]
    );
    for (let i = 0; i < plannedProbands.length; i++) {
      plannedProbands[i].study_accesses = await db.manyOrNone(
        'SELECT * FROM study_planned_probands WHERE user_id=$1',
        [plannedProbands[i].user_id]
      );
    }
    return plannedProbands;
  }

  async function createPlannedProbands(probands, study_accesses) {
    const createdPlannedProbands = [];
    for (let i = 0; i < probands.length; i++) {
      const existingProband = await db.oneOrNone(
        'SELECT username FROM users WHERE username=$1',
        [probands[i][0]]
      );
      if (!existingProband) {
        const createdPlannedProband = await db
          .oneOrNone(
            'INSERT INTO planned_probands VALUES($1:csv) RETURNING *',
            [probands[i]]
          )
          .catch(() => {
            createdPlannedProbands.push({
              user_id: probands[i][0],
              password: probands[i][1],
              activated_at: probands[i][2],
              study_accesses: [],
              wasCreated: false,
            });
          });

        if (createdPlannedProband) {
          createdPlannedProband.wasCreated = true;
          createdPlannedProband.study_accesses = [];
          for (let j = 0; j < study_accesses.length; j++) {
            const created_access = await db.one(
              'INSERT INTO study_planned_probands VALUES($1, $2) RETURNING *',
              [study_accesses[j], probands[i][0]]
            );
            createdPlannedProband.study_accesses.push(created_access);
          }
          createdPlannedProbands.push(createdPlannedProband);
        }
      } else {
        createdPlannedProbands.push({
          user_id: probands[i][0],
          password: probands[i][1],
          activated_at: probands[i][2],
          study_accesses: [],
          wasCreated: false,
        });
      }
    }
    return createdPlannedProbands;
  }

  async function deletePlannedProbandAsUser(user_id, requester_id) {
    return await db.one(
      'DELETE FROM planned_probands WHERE user_id=$1 AND user_id IN(SELECT user_id FROM study_planned_probands WHERE study_id IN(SELECT study_id FROM study_users WHERE user_id=$2)) RETURNING *',
      [user_id, requester_id]
    );
  }

  async function getLabResult(id) {
    return await db.one('SELECT * FROM lab_results WHERE id=$1', [id]);
  }

  async function areInstanceIdsFromUser(userId, instanceIds, options) {
    const myDb = getDbTransactionFromOptionsOrDbConnection(options);
    if (!instanceIds || instanceIds.length === 0) return true;
    const notAllowedInstances = await myDb.manyOrNone(
      'SELECT id FROM questionnaire_instances WHERE id IN ($(instanceIds:csv)) AND user_id = $(userId)',
      { instanceIds, userId }
    );
    return notAllowedInstances.length === instanceIds.length;
  }

  async function areSampleIdsFromUser(userId, sampleIds, options) {
    const myDb = getDbTransactionFromOptionsOrDbConnection(options);
    if (!sampleIds || sampleIds.length === 0) return true;
    const notAllowedSamples = await myDb.manyOrNone(
      'SELECT id FROM lab_results WHERE id IN ($(sampleIds:csv)) AND user_id = $(userId)',
      { sampleIds, userId }
    );
    return notAllowedSamples.length === sampleIds.length;
  }

  async function getMobileVersion() {
    return await db.one(
      'SELECT * FROM app_info WHERE release_date = ( SELECT MAX(release_date) FROM app_info) '
    );
  }

  async function getProbandsToContact(requesterId) {
    const probandsToContact = await db.manyOrNone(
      'SELECT uc.*, u.account_status,u.study_status, u.ids ' +
        'FROM users_to_contact as uc ' +
        'LEFT JOIN users as u ON u.username=uc.user_id ' +
        'WHERE uc.user_id IN (SELECT user_id FROM study_users WHERE study_id IN(SELECT study_id FROM study_users WHERE user_id=$(requesterId))) ' +
        "AND u.account_status != 'deactivated' " +
        'ORDER BY created_at DESC',
      { requesterId }
    );
    if (probandsToContact) {
      for (let i = 0; i < probandsToContact.length; i++) {
        const notableAnswerQuestionnaireInstanceIds =
          probandsToContact[i].notable_answer_questionnaire_instances;
        const notFilledoutQuestionnaireInstanceIds =
          probandsToContact[i].not_filledout_questionnaire_instances;

        let res = await db.manyOrNone(
          'SELECT questionnaire_name from questionnaire_instances WHERE id=ANY($1)',
          [notableAnswerQuestionnaireInstanceIds]
        );
        if (res && res.length > 0) {
          probandsToContact[i].notable_answer_questionnaire_instances = res;
        }

        res = await db.manyOrNone(
          'SELECT questionnaire_name from questionnaire_instances WHERE id=ANY($1)',
          [notFilledoutQuestionnaireInstanceIds]
        );
        if (res && res.length > 0) {
          probandsToContact[i].not_filledout_questionnaire_instances = res;
        }
      }
    }
    return probandsToContact;
  }

  async function updateProbandToContact(id, data) {
    return await db.oneOrNone(
      'UPDATE users_to_contact SET processed=$2 WHERE id=$1',
      [id, data.processed]
    );
  }

  async function getCommonStudiesOfAllUsers(users, options) {
    if (!users || users.length === 0) return [];
    const myDb = getDbTransactionFromOptionsOrDbConnection(options);
    return myDb
      .manyOrNone(
        `SELECT study_id
             FROM study_users
             WHERE user_id IN ($(users:csv))
             GROUP BY study_id
             HAVING COUNT(user_id) = $(length);`,
        {
          users,
          length: users.length,
        }
      )
      .then((rows) => rows.map((row) => row.study_id));
  }

  async function getPseudonyms(study, accountStatus) {
    let query = 'SELECT username FROM users AS u\n';
    if (study) {
      query += 'JOIN study_users AS su ON u.username = su.user_id\n';
    }
    query += "WHERE u.role = 'Proband'\n";
    if (study) {
      query += 'AND su.study_id = $(study)\n';
    }
    if (accountStatus && accountStatus.length > 0) {
      query += 'AND u.account_status IN ($(accountStatus:csv))';
    }
    return db
      .manyOrNone(query, { study, accountStatus })
      .then((result) => result.map((row) => row.username));
  }

  return {
    /**
     * @function
     * @description gets the user with the specified username
     * @memberof module:postgresqlHelper
     * @param {string} username the username of the user to find
     * @returns {Promise} a resolved promise with the found user or a rejected promise with the error
     */
    getUser: getUser,

    /**
     * @function
     * @description checks if a user with the specified username exists
     * @memberof module:postgresqlHelper
     * @param username {string} the username of the checked user
     * @return {Promise<boolean>}
     */
    isUserExistentByUsername: isUserExistentByUsername,

    /**
     * @function
     * @description checks if a user with the specified ids exists
     * @memberof module:postgresqlHelper
     * @param ids {string} the ids of the checked user
     * @return {Promise<boolean>}
     */
    isUserExistentByIds: isUserExistentByIds,

    /**
     * @function
     * @description looks up ids by username
     * @memberof module:postgresqlHelper
     * @param username {string} the username of the respective user
     * @return {Promise<string>}
     */
    lookupUserIds: lookupUserIds,

    /**
     * @function
     * @description looks up mapping ID by username
     * @memberof module:postgresqlHelper
     * @param username {string} the username of the respective user
     * @return {Promise<string>}
     */
    lookupMappingId: lookupMappingId,

    /**
     * @function
     * @description gets the user with the specified username and selects all data
     * @memberof module:postgresqlHelper
     * @param {string} username the username of the user to find
     * @returns {Promise} a resolved promise with the found user or a rejected promise with the error
     */
    getUserAllData: getUserAllData,

    /**
     * @function
     * @description gets the study with the specified name
     * @memberof module:postgresqlHelper
     * @param {string} study_id the name of the study to find
     * @returns {Promise} a resolved promise with the found study or a rejected promise with the error
     */
    getStudy: getStudy,

    /**
     * @function
     * @description gets the user if the professional user has access to
     * @memberof module:postgresqlHelper
     * @param {number} username the username of the user to find
     * @returns {Promise} a resolved promise with the found user or a rejected promise with the error
     */
    getUserAsProfessional: getUserAsProfessional,

    /**
     * searches for the
     * @param ids {string}
     * @param requesterName {string}
     * @return {object}
     */
    getUserAsProfessionalByIDS: getUserAsProfessionalByIDS,

    /**
     * @function
     * @description gets the users the professional User has access to
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the found users or a rejected promise with the error
     */
    getUsersForProfessional: getUsersForProfessional,

    /**
     * @function
     * @description gets the users the PM has access to
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the found users or a rejected promise with the error
     */
    getUsersForPM: getUsersForPM,

    /**
     * @function
     * @description get all users with the same role as a requester
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the found users or a rejected promise with the error
     */
    getUsersWithSameRole: getUsersWithSameRole,

    /**
     * @function
     * @description gets the non-proband users for the sysadmin
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the found users or a rejected promise with the error
     */
    getUsersForSysAdmin: getUsersForSysAdmin,

    /**
     * @function
     * @description creates the proband for sormas
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the created proband or a rejected promise with the error
     */
    createSormasProband: createSormasProband,

    /**
     * @function
     * @description creates the proband
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the created proband or a rejected promise with the error
     */
    createProband: createProband,

    /**
     * @function
     * @description creates the ids proband
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the created ids proband or a rejected promise with the error
     */
    createIDSProband: createIDSProband,

    /**
     * @function
     * @description inserts the given study accesses
     * @memberof module:postgresqlHelper
     */
    insertStudyAccessesWithAccessLevel: insertStudyAccessesWithAccessLevel,

    /**
     * @function
     * @description update the user state whether to be considered as Test Proband or not
     * @memberof module:postgresqlHelper
     * @param {String} userName the name of the user to update
     * @param {Boolean} Test Proband state
     * @returns {Promise} a resolved promise with the updated user or a rejected promise with the error
     */
    changeTestProbandState: changeTestProbandState,

    /**
     * @function
     * @description deletes the pending deletion and cancels all delete actions associated with it
     * @memberof module:postgresqlHelper
     * @param {number} id the id of the pending deletion to delete
     * @returns {Promise} a resolved promise with the deleted pending deletion or a rejected promise with the error
     */
    cancelPendingDeletion: cancelPendingDeletion,

    /**
     * @function
     * @description deletes the pending deletion
     * @memberof module:postgresqlHelper
     * @param {number} id the id of the pending deletion to delete
     * @returns {Promise} a resolved promise with the deleted pending deletion or a rejected promise with the error
     */
    deletePendingDeletion: deletePendingDeletion,

    /**
     * @function
     * @description gets the pending deletion
     * @memberof module:postgresqlHelper
     * @param {number} id the id of the pending deletion to get
     * @returns {Promise} a resolved promise with the pending deletion or a rejected promise with the error
     */
    getPendingDeletion: getPendingDeletion,

    /**
     * @function
     * @description gets the pending deletion
     * @memberof module:postgresqlHelper
     * @param {string} proband_id the id of proband for the pending deletion to get
     * @returns {Promise} a resolved promise with the pending deletion or a rejected promise with the error
     */
    getPendingDeletionForProbandId: getPendingDeletionForProbandId,

    /**
     * @function
     * @description gets the pending deletion
     * @memberof module:postgresqlHelper
     * @param {string} sample_id the id of sample for the pending deletion to get
     * @returns {Promise} a resolved promise with the pending deletion or a rejected promise with the error
     */
    getPendingDeletionForSampleId: getPendingDeletionForSampleId,

    /**
     * @function
     * @description gets the study deletion
     * @memberof module:postgresqlHelper
     * @param {string} study_id the id of study for the pending deletion to get
     * @returns {Promise} a resolved promise with the pending deletion or a rejected promise with the error
     */
    getPendingDeletionForStudyId: getPendingDeletionForStudyId,

    /**
     * @function
     * @description gets the pending deletion
     * @memberof module:postgresqlHelper
     * @param {string} proband_id the id of proband for the pending deletion to get
     * @returns {Promise} a resolved promise with the pending deletion or a rejected promise with the error
     */
    getPendingDeletionForProbandIdIfExisting:
      getPendingDeletionForProbandIdIfExisting,

    /**
     * @function
     * @description gets the study deletion
     * @memberof module:postgresqlHelper
     * @param {string} study_id the id of study for the pending deletion to get
     * @returns {Promise} a resolved promise with the pending deletion or a rejected promise with the error
     */
    getPendingDeletionForStudyIdIfExisting:
      getPendingDeletionForStudyIdIfExisting,

    /**
     * @function
     * @description gets the pending deletion
     * @memberof module:postgresqlHelper
     * @param {string} sample_id the id of sample for the pending deletion to get
     * @returns {Promise} a resolved promise with the pending deletion or a rejected promise with the error
     */
    getPendingDeletionForSampleIdIfExisting:
      getPendingDeletionForSampleIdIfExisting,

    /**
     * @function
     * @description creates a pending deletion
     * @memberof module:postgresqlHelper
     * @param {number} data the pending deletions data
     * @returns {Promise} a resolved promise with the created pending deletion or a rejected promise with the error
     */
    createPendingDeletion: createPendingDeletion,

    /**
     * @function
     * @description updates the pending compliance change and performs all update actions associated with it
     * @memberof module:postgresqlHelper
     * @param {number} id the id of the pending compliance change to update
     * @returns {Promise} a resolved promise with the updated pending compliance change or a rejected promise with the error
     */
    updatePendingComplianceChange: updatePendingComplianceChange,

    /**
     * @function
     * @description deletes the pending compliance change and cancels all update actions associated with it
     * @memberof module:postgresqlHelper
     * @param {number} id the id of the pending compliance change to delete
     * @returns {Promise} a resolved promise with the deleted pending compliance change or a rejected promise with the error
     */
    deletePendingComplianceChange: deletePendingComplianceChange,

    /**
     * @function
     * @description gets the pending compliance change
     * @memberof module:postgresqlHelper
     * @param {number} id the id of the pending compliance change to get
     * @returns {Promise} a resolved promise with the pending decompliance changeletion or a rejected promise with the error
     */
    getPendingComplianceChange: getPendingComplianceChange,

    /**
     * @function
     * @description gets the pending compliance change
     * @memberof module:postgresqlHelper
     * @param {string} proband_id the id of proband for the pending compliance change to get
     * @returns {Promise} a resolved promise with the pending compliance change or a rejected promise with the error
     */
    getPendingComplianceChangeForProbandIdIfExisting:
      getPendingComplianceChangeForProbandIdIfExisting,

    /**
     * @function
     * @description creates a pending compliance change
     * @memberof module:postgresqlHelper
     * @param {number} data the pending compliance changes data
     * @returns {Promise} a resolved promise with the created pending compliance change or a rejected promise with the error
     */
    createPendingComplianceChange: createPendingComplianceChange,

    /**
     * @function
     * @description updates the pending study change and performs all update actions associated with it
     * @memberof module:postgresqlHelper
     * @param {number} id the id of the pending study change to update
     * @returns {Promise} a resolved promise with the updated pending study change or a rejected promise with the error
     */
    updatePendingStudyChange: updatePendingStudyChange,

    /**
     * @function
     * @description deletes the pending study change and cancels all update actions associated with it
     * @memberof module:postgresqlHelper
     * @param {number} id the id of the pending study change to delete
     * @returns {Promise} a resolved promise with the deleted pending study change or a rejected promise with the error
     */
    deletePendingStudyChange: deletePendingStudyChange,

    /**
     * @function
     * @description gets the pending study change
     * @memberof module:postgresqlHelper
     * @param {number} id the id of the pending study change to get
     * @returns {Promise} a resolved promise with the pending study change or a rejected promise with the error
     */
    getPendingStudyChange: getPendingStudyChange,

    /**
     * @function
     * @description gets the pending study change
     * @memberof module:postgresqlHelper
     * @param {string} proband_id the id of study for the pending study change to get
     * @returns {Promise} a resolved promise with the pending study change or a rejected promise with the error
     */
    getPendingStudyChangeForStudyIdIfExisting:
      getPendingStudyChangeForStudyIdIfExisting,

    /**
     * @function
     * @description creates a pending study change
     * @memberof module:postgresqlHelper
     * @param {number} data the pending study changes data
     * @returns {Promise} a resolved promise with the created pending study change or a rejected promise with the error
     */
    createPendingStudyChange: createPendingStudyChange,

    /**
     * @function
     * @description deletes the user  and all its data with the specified username
     * @memberof module:postgresqlHelper
     * @param {number} username the username of the user to delete
     * @returns {Promise} a resolved promise with the deleted user and counts for deletes other data or a rejected promise with the error
     */
    deleteUser: deleteUser,

    /**
     * @function
     * @description deletes the user  and all its data with the specified username
     * @memberof module:postgresqlHelper
     * @param {string} user_id the username of the user to update
     * @param {string} status the new status
     * @returns {Promise} a resolved promise with the deleted user and counts for deletes other data or a rejected promise with the error
     */
    updateProbandStatus: updateProbandStatus,

    /**
     * @function
     * @description updates the user's settings
     * @memberof module:postgresqlHelper
     * @param {String} userName the name of the user to update settings for
     * @param {Object} userSettings contains the user settings
     * @returns {Promise} a resolved promise with the updated settings or a rejected promise with the error
     */
    updateUserSettings: updateUserSettings,

    /**
     * @function
     * @description gets the user's settings
     * @memberof module:postgresqlHelper
     * @param {String} userName the name of the user to get settings for
     * @returns {Promise} a resolved promise with the users settings or a rejected promise with the error
     */
    getUserSettings: getUserSettings,

    /**
     * @function
     * @description gets the user's study accesses
     * @memberof module:postgresqlHelper
     * @param {String} userName the name of the user to get accesses for
     * @returns {Promise} a resolved promise with the users study accesses or a rejected promise with the error
     */
    getStudyAccessesForUser: getStudyAccessesForUser,

    /**
     * @function
     * @description gets the planned proband
     * @memberof module:postgresqlHelper
     * @param {String} user_id the pseudonym of the planned proband to get
     * @param {String} requester_id the user_id of the user who requests
     * @returns {Promise} a resolved promise with the planned proband or a rejected promise with the error
     */
    getPlannedProbandAsUser: getPlannedProbandAsUser,

    /**
     * @function
     * @description gets the planned probands
     * @memberof module:postgresqlHelper
     * @param {String} requester_id the user_id of the user who requests
     * @returns {Promise} a resolved promise with the planned probands or a rejected promise with the error
     */
    getPlannedProbandsAsUser: getPlannedProbandsAsUser,

    /**
     * @function
     * @description activates the planned proband
     * @memberof module:postgresqlHelper
     */
    activatePlannedProband: activatePlannedProband,

    /**
     * @function
     * @description gets the planned proband
     * @memberof module:postgresqlHelper
     * @param {array} probands the array of planned probands to create
     * @returns {Promise} a resolved promise with the planned proband or a rejected promise with the error
     */
    createPlannedProbands: createPlannedProbands,

    /**
     * @function
     * @description deletes the planned proband
     * @memberof module:postgresqlHelper
     * @param {String} user_id the pseudonym of the planned proband to delete
     * @param {String} requester_id the user_id of the user who requests
     * @returns {Promise} a resolved promise with the deleted planned proband or a rejected promise with the error
     */
    deletePlannedProbandAsUser: deletePlannedProbandAsUser,

    /**
     * @function
     * @description gets the lab result
     * @memberof module:postgresqlHelper
     * @param {String} id the id of the lab result to get
     * @returns {Promise} a resolved promise with the found lab result or a rejected promise with the error
     */
    getLabResult: getLabResult,

    /**
     * @function
     * @description checks if all instance ids belong to the given user
     * @memberof module:postgresqlHelper
     * @param {String} userId the id of the user who should be checked
     * @param {Array} instanceIds an array with ids to check
     * @returns {Promise} true if all instances belong to the user, otherwise false
     */
    areInstanceIdsFromUser: areInstanceIdsFromUser,

    /**
     * @function
     * @description checks if all sample ids belong to the given user
     * @memberof module:postgresqlHelper
     * @param {String} userId the id of the user who should be checked
     * @param {Array} sampleIds an array with ids to check
     * @returns {Promise} true if all samples belong to the user, otherwise false
     */
    areSampleIdsFromUser: areSampleIdsFromUser,

    /**
     * @function
     * @description gets the mobile app version
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the found mobile version or a rejected promise with the error
     */
    getMobileVersion: getMobileVersion,

    /**
     * @function
     * @description gets the probands to contact from db
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the found probands or a rejected promise with the error
     */
    getProbandsToContact: getProbandsToContact,

    /**
     * @function
     * @description updates the probands to contact in db
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the updated probands to contact or a rejected promise with the error
     */
    updateProbandToContact: updateProbandToContact,

    /**
     * @function
     * @description deletes all of the proband's data
     * @memberof module:postgresqlHelper
     * @param {string} username
     * @param {boolean} keepUsageData
     * @returns {Promise} a resolved promise returning when deletion is finished
     */
    deleteProbandData: deleteProbandData,

    /**
     * @function
     * @description deletes all of the sample's data
     * @memberof module:postgresqlHelper
     * @param {string} lab result id
     * @returns {Promise} a resolved promise returning when deletion is finished
     */
    deleteSampleData: deleteSampleData,

    /**
     * @function
     * @description deletes all of the study's data
     * @memberof module:postgresqlHelper
     * @param {string} study id
     * @returns {Promise} a resolved promise returning when deletion is finished
     */
    deleteStudyData: deleteStudyData,

    /**
     * @function
     * @description gets the external compliances of a user
     * @memberof module:postgresqlHelper
     * @param {string} username
     * @returns {Promise} a resolved promise returning when deletion is finished
     */
    getUserExternalCompliance: getUserExternalCompliance,

    /**
     * @function
     * @description gets the name of the primary study of a proband
     * @memberof module:postgresqlHelper
     * @param {string} username
     * @returns {Promise<string>} the name of the study
     */
    getPrimaryStudyOfProband: getPrimaryStudyOfProband,

    getPseudonyms: getPseudonyms,

    /**
     * @function
     * @description gets a list of all studies all of the user have in common
     * @param {string[]} users the users to be checked
     * @param {IOptions} options a optional transaction
     * @return {Promise<string[]>} the names of all common studies
     */
    getCommonStudiesOfAllUsers: getCommonStudiesOfAllUsers,

    /**
     * @function
     * @description gets a list of all probands of the given study
     * @param {string} study_id the name of the study
     * @return {Promise<string[]>} the username of all probands
     */
    getStudyProbands: getStudyProbands,
  };
})();

module.exports = postgresqlHelper;
