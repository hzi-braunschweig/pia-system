/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { db, getDbTransactionFromOptionsOrDbConnection } = require('../db');

/**
 * @description helper methods to access db
 */
const postgresqlHelper = (function () {
  async function getStudy(studyName) {
    return db.one('SELECT * FROM studies WHERE name=${studyName}', {
      studyName,
    });
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

  async function changeTestProbandState(
    pseudonym,
    isTestProband,
    requesterStudies
  ) {
    return db.one(
      `UPDATE probands AS p
         SET is_test_proband=$(isTestProband)
         WHERE p.pseudonym = $(pseudonym)
           AND p.study IN ($(requesterStudies:csv))
           AND p.status = 'active'
         RETURNING p.pseudonym`,
      { pseudonym, isTestProband, requesterStudies }
    );
  }

  async function deleteProbandData(pseudonym, deletionType, options) {
    const myDb = getDbTransactionFromOptionsOrDbConnection(options);
    // Check if user is Proband first - throws an error if proband not found
    await myDb.one('SELECT * FROM probands WHERE pseudonym=$(pseudonym)', {
      pseudonym,
    });
    // Delete users data
    await myDb.none('DELETE FROM user_files WHERE user_id = $(pseudonym)', {
      pseudonym,
    });
    await myDb.none(
      'DELETE FROM questionnaire_instances_queued WHERE user_id = $(pseudonym)',
      { pseudonym }
    );
    let deleteQuestionnaireInstancesQuery;
    if (deletionType === 'keep_usage_data') {
      deleteQuestionnaireInstancesQuery = `DELETE
                                                 FROM questionnaire_instances
                                                 WHERE questionnaire_instances.id IN (
                                                     SELECT questionnaire_instances.id
                                                     FROM questionnaire_instances
                                                              INNER JOIN questionnaires q
                                                                         ON questionnaire_instances.questionnaire_id = q.id
                                                     WHERE questionnaire_instances.user_id = $(pseudonym)
                                                       AND q.keep_answers != true
                                                     )`;
    } else {
      deleteQuestionnaireInstancesQuery =
        'DELETE FROM questionnaire_instances WHERE user_id = $(pseudonym)';
    }
    await myDb.none(deleteQuestionnaireInstancesQuery, {
      pseudonym,
    });
    await myDb.none(
      'DELETE FROM notification_schedules WHERE user_id = $(pseudonym)',
      {
        pseudonym,
      }
    );
    await myDb.none('DELETE FROM lab_results WHERE user_id = $(pseudonym)', {
      pseudonym,
    });
    await myDb.none('DELETE FROM blood_samples WHERE user_id = $(pseudonym)', {
      pseudonym,
    });
    if (deletionType === 'full') {
      await myDb.none(`DELETE FROM probands WHERE pseudonym = $(pseudonym)`, {
        pseudonym,
      });
    } else {
      await myDb.none(
        `UPDATE probands
            SET
                first_logged_in_at=NULL,
                compliance_labresults=FALSE,
                compliance_samples=FALSE,
                compliance_bloodsamples=FALSE,
                compliance_contact= FALSE,
                needs_material=NULL,
                study_center=NULL,
                examination_wave=NULL,
                status='deleted',
                logging_active=NULL,
                deleted_at=NOW()
            WHERE pseudonym = $(pseudonym)`,
        { pseudonym }
      );
    }
  }

  async function deleteStudyData(study_id, options) {
    const myDb = getDbTransactionFromOptionsOrDbConnection(options);
    // Delete study data

    // Get all professional users from study
    const users = (
      await myDb.manyOrNone(
        'SELECT user_id FROM study_users WHERE study_id=$(study_id)',
        { study_id }
      )
    ).map((user) => user.username);

    // Delete probands
    await myDb.none('DELETE FROM probands WHERE study = $(study_id)', {
      study_id,
    });

    // Delete planned probands
    await myDb.none(
      'DELETE FROM study_planned_probands WHERE study_id = $(study_id)',
      {
        study_id,
      }
    );
    await myDb.none(
      'DELETE FROM planned_probands WHERE user_id NOT IN (SELECT user_id FROM study_planned_probands)'
    );

    // Delete professional users data in study
    await myDb.none('DELETE FROM study_users WHERE study_id=$(study_id)', {
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

    // Delete questionnaires
    await myDb.none('DELETE FROM questionnaires WHERE study_id=$(study_id)', {
      study_id,
    });

    return await myDb.one(
      "UPDATE studies SET description=null,pm_email=null,hub_email=null,status='deleted' WHERE name=$(study_id) RETURNING *",
      {
        study_id,
      }
    );
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
      if (pendingDeletion.type === 'sample') {
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

  async function getPendingProbandDeletionsOfStudy(studyName, type) {
    return await db.manyOrNone(
      `SELECT pd.*
             FROM pending_deletions AS pd
                      JOIN probands AS p ON p.pseudonym = pd.for_id
             WHERE type = $(type)
               AND p.study = $(studyName)`,
      { studyName, type }
    );
  }

  async function getPendingDeletion(id) {
    return await db.oneOrNone(
      'SELECT * FROM pending_deletions WHERE id=$(id)',
      { id }
    );
  }

  async function getPendingDeletionByForIdAndType(forId, type) {
    return await db.oneOrNone(
      'SELECT * FROM pending_deletions WHERE for_id=$(forId) AND type = $(type)',
      {
        forId,
        type,
      }
    );
  }

  async function createPendingDeletion(data) {
    return await db.tx(async (t) => {
      const result = await t.one(
        'INSERT INTO pending_deletions(requested_by, requested_for, type, for_id) VALUES ($(requested_by), $(requested_for), $(type), $(for_id)) RETURNING *',
        data
      );
      if (data.type === 'sample') {
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
    const proband = await db.one('SELECT * FROM probands WHERE pseudonym=$1', [
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

  async function getPendingComplianceChangesOfStudy(studyName) {
    return await db.manyOrNone(
      `SELECT pcc.*
         FROM pending_compliance_changes AS pcc
                JOIN probands AS p ON p.pseudonym = pcc.proband_id
         WHERE p.study = $(studyName)`,
      { studyName }
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

  async function updatePendingComplianceChange(id, options, newCC) {
    const myDb = getDbTransactionFromOptionsOrDbConnection(options);
    const cc = newCC
      ? newCC
      : await myDb.one('SELECT * FROM pending_compliance_changes WHERE id=$1', [
          id,
        ]);
    await myDb.none(
      'UPDATE probands SET compliance_labresults=$1, compliance_samples=$2, compliance_bloodsamples=$3 WHERE pseudonym=$4',
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
    for (const item of plannedProbands) {
      item.study_accesses = await db.manyOrNone(
        'SELECT * FROM study_planned_probands WHERE user_id=$1',
        [item.user_id]
      );
    }
    return plannedProbands;
  }

  async function createPlannedProbands(probands, study_accesses) {
    const createdPlannedProbands = [];
    for (const proband of probands) {
      const existingProband = await db.oneOrNone(
        'SELECT pseudonym FROM probands WHERE pseudonym=$1',
        [proband[0]]
      );
      if (!existingProband) {
        const createdPlannedProband = await db
          .oneOrNone(
            'INSERT INTO planned_probands VALUES($1:csv) RETURNING *',
            [proband]
          )
          .catch(() => {
            createdPlannedProbands.push({
              user_id: proband[0],
              password: proband[1],
              activated_at: proband[2],
              study_accesses: [],
              wasCreated: false,
            });
          });

        if (createdPlannedProband) {
          createdPlannedProband.wasCreated = true;
          createdPlannedProband.study_accesses = [];
          for (const item of study_accesses) {
            const created_access = await db.one(
              'INSERT INTO study_planned_probands VALUES($1, $2) RETURNING *',
              [item, proband[0]]
            );
            createdPlannedProband.study_accesses.push(created_access);
          }
          createdPlannedProbands.push(createdPlannedProband);
        }
      } else {
        createdPlannedProbands.push({
          user_id: proband[0],
          password: proband[1],
          activated_at: proband[2],
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

  async function getUserOfLabResult(id) {
    return await db
      .one('SELECT user_id FROM lab_results WHERE id=$(id)', {
        id,
      })
      .then((result) => result.user_id);
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

  async function getProbandsToContact(requesterStudies) {
    const probandsToContact = await db.manyOrNone(
      `SELECT uc.*, p.status, p.ids, p.study
         FROM users_to_contact AS uc
           LEFT JOIN probands AS p ON p.pseudonym = uc.user_id
         WHERE p.study IN ($(requesterStudies:csv))
           AND p.status = 'active'
         ORDER BY created_at DESC`,
      { requesterStudies }
    );
    if (probandsToContact) {
      for (const probandToContact of probandsToContact) {
        const notableAnswerQuestionnaireInstanceIds =
          probandToContact.notable_answer_questionnaire_instances;
        const notFilledoutQuestionnaireInstanceIds =
          probandToContact.not_filledout_questionnaire_instances;

        let res = await db.manyOrNone(
          'SELECT questionnaire_name from questionnaire_instances WHERE id=ANY($1)',
          [notableAnswerQuestionnaireInstanceIds]
        );
        if (res && res.length > 0) {
          probandToContact.notable_answer_questionnaire_instances = res;
        }

        res = await db.manyOrNone(
          'SELECT questionnaire_name from questionnaire_instances WHERE id=ANY($1)',
          [notFilledoutQuestionnaireInstanceIds]
        );
        if (res && res.length > 0) {
          probandToContact.not_filledout_questionnaire_instances = res;
        }
      }
    }
    return probandsToContact;
  }

  async function updateProbandToContact(id, data) {
    return await db.none(
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

  async function updateStudyWelcomeText(study_id, welcomeText) {
    return db.one(
      'INSERT INTO study_welcome_text (study_id, welcome_text)' +
        ' VALUES ($1, $2) ON CONFLICT (study_id, language) DO UPDATE' +
        ' SET welcome_text=excluded.welcome_text RETURNING *',
      [study_id, welcomeText]
    );
  }

  async function getStudyWelcomeText(study_id, language = 'de_DE') {
    return db.oneOrNone(
      'SELECT * FROM study_welcome_text WHERE study_id = $1 AND language=$2',
      [study_id, language]
    );
  }

  async function createStudy(study) {
    return db.one(
      'INSERT INTO studies(name, description, pm_email, hub_email) VALUES(${name}, ${description}, ${pm_email}, ${hub_email}) RETURNING *',
      {
        name: study.name,
        description: study.description,
        pm_email: study.pm_email,
        hub_email: study.hub_email,
      }
    );
  }

  async function updateStudyAsAdmin(id, study) {
    return db.one(
      'UPDATE studies SET name=${name}, description=${description}, pm_email=${pm_email}, hub_email=${hub_email} WHERE name=${id} RETURNING *',
      {
        name: study.name,
        description: study.description,
        pm_email: study.pm_email,
        hub_email: study.hub_email,
        id: id,
      }
    );
  }

  async function getStudiesByStudyIds(ids) {
    const studies = await db.many(
      'SELECT * FROM studies WHERE name = ANY(${sIds})',
      { sIds: ids }
    );

    if (studies.length > 0) {
      const pendingStudyChanges = await db.manyOrNone(
        'SELECT * FROM pending_study_changes WHERE study_id IN($1:csv)',
        [studies.map((study) => study.name)]
      );

      studies.forEach((study) => {
        study.pendingStudyChange = pendingStudyChanges.find((sc) => {
          return sc.study_id === study.name;
        });
      });
    }
    return studies;
  }

  async function getStudies() {
    return db.manyOrNone('SELECT * FROM studies');
  }

  return {
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

    getPendingProbandDeletionsOfStudy: getPendingProbandDeletionsOfStudy,

    /**
     * @function
     * @description gets the pending deletion
     * @memberof module:postgresqlHelper
     * @param {number} id the id of the pending deletion to get
     * @returns {Promise<PendingDeletionDto>}
     */
    getPendingDeletion: getPendingDeletion,

    /**
     * @function
     * @description gets the pending deletion by for_id and type
     * @memberof module:postgresqlHelper
     * @param {number} id the id of the pending deletion to get
     * @param {PendingDeletionType} id the id of the pending deletion to get
     * @returns {Promise<PendingDeletionDto>}
     */
    getPendingDeletionByForIdAndType: getPendingDeletionByForIdAndType,

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
     * @param {object} options
     * @param {PendingComplianceChange} newCC
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
     * @param {string} id the id of the pending compliance change to get
     * @returns {Promise} a resolved promise with the pending decompliance changeletion or a rejected promise with the error
     */
    getPendingComplianceChange: getPendingComplianceChange,

    getPendingComplianceChangesOfStudy: getPendingComplianceChangesOfStudy,

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
     * @description gets the planned proband
     * @memberof module:postgresqlHelper
     * @param {String} user_id the pseudonym of the planned proband to get
     * @param {String} requester_id the user_id of the user who requests
     * @returns {Promise<PlannedProbandDeprecated>} a resolved promise with the planned proband or a rejected promise with the error
     */
    getPlannedProbandAsUser: getPlannedProbandAsUser,

    /**
     * @function
     * @description gets the planned probands
     * @memberof module:postgresqlHelper
     * @param {String} requester_id the user_id of the user who requests
     * @returns {Promise<PlannedProbandDeprecated[]>} a resolved promise with the planned probands or a rejected promise with the error
     */
    getPlannedProbandsAsUser: getPlannedProbandsAsUser,

    /**
     * @function
     * @description gets the planned proband
     * @memberof module:postgresqlHelper
     * @param {array} probands the array of planned probands to create
     * @returns {Promise<PlannedProbandDeprecated[]>} a resolved promise with the planned proband or a rejected promise with the error
     */
    createPlannedProbands: createPlannedProbands,

    /**
     * @function
     * @description deletes the planned proband
     * @memberof module:postgresqlHelper
     * @param {String} user_id the pseudonym of the planned proband to delete
     * @param {String} requester_id the user_id of the user who requests
     * @returns {Promise<PlannedProbandDeprecated>} a resolved promise with the deleted planned proband or a rejected promise with the error
     */
    deletePlannedProbandAsUser: deletePlannedProbandAsUser,

    /**
     * @function
     * @description gets the lab result
     * @memberof module:postgresqlHelper
     * @param {String} id the id of the lab result to get
     * @returns {Promise} a resolved promise with the found lab result or a rejected promise with the error
     */
    getUserOfLabResult: getUserOfLabResult,

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
     * @description gets the probands to contact from db
     * @memberof module:postgresqlHelper
     * @returns {Promise<ProbandToContact[]>} a resolved promise with the found probands or a rejected promise with the error
     */
    getProbandsToContact: getProbandsToContact,

    /**
     * @function
     * @description updates the probands to contact in db
     * @memberof module:postgresqlHelper
     * @returns {Promise<null>} a resolved promise with the updated probands to contact or a rejected promise with the error
     */
    updateProbandToContact: updateProbandToContact,

    /**
     * @function
     * @description deletes all of the proband's data
     * @memberof module:postgresqlHelper
     * @param {string} username
     * @param {'full'|'keep_usage_data'|'default'} deletionType
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
     * @description gets a list of all studies all of the user have in common
     * @param {string[]} users the users to be checked
     * @param {IOptions} options a optional transaction
     * @return {Promise<string[]>} the names of all common studies
     */
    getCommonStudiesOfAllUsers: getCommonStudiesOfAllUsers,

    /**
     * @function
     * @description updates the study Access with the specified id
     * @memberof module:postgresqlHelper
     * @param {string} study_name the study_name of the access to update
     * @param {string} welcomeText the welcome text of study to update
     * @returns {Promise} a resolved promise with the updated study access or a rejected promise with the error
     */
    updateStudyWelcomeText: updateStudyWelcomeText,

    /**
     * @function
     * @description updates the study Access with the specified id
     * @memberof module:postgresqlHelper
     * @param {string} study_id the study_id of the access to update
     * @returns {Promise} a resolved promise with the updated study access or a rejected promise with the error
     */
    getStudyWelcomeText: getStudyWelcomeText,

    /**
     * @function
     * @description creates a study
     * @memberof module:postgresqlHelper
     * @param {object} study the study to create
     * @returns {Promise} a resolved promise with the created study or a rejected promise with the error
     */
    createStudy: createStudy,

    /**
     * @function
     * @description updates the study with the specified id
     * @memberof module:postgresqlHelper
     * @param {string} id the id of the study to update
     * @param {object} study the updated study
     * @returns {Promise} a resolved promise with the updated study or a rejected promise with the error
     */
    updateStudyAsAdmin: updateStudyAsAdmin,

    /**
     * @function
     * @description gets the studies with the specified ids
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the found studies or a rejected promise with the error
     */
    getStudiesByStudyIds: getStudiesByStudyIds,

    /**
     * @function
     * @description gets all studies
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the found studies or a rejected promise with the error
     */
    getStudies: getStudies,
  };
})();

module.exports = postgresqlHelper;
