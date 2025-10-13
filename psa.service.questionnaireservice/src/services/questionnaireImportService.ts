/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { assert } from 'ts-essentials';
import { EntityManager } from 'typeorm';
import { dataSource } from '../db';
import { AnswerOption } from '../entities/answerOption';
import { Condition } from '../entities/condition';
import { Question } from '../entities/question';
import { Questionnaire as QuestionnaireEntity } from '../entities/questionnaire';
import {
  DuplicateQuestionnaireKeyError,
  ImportConditionAnswerOptionReferenceError,
  ImportConditionQuestionnaireReferenceError,
  ImportJsonParseError,
  ImportJsonSchemaError,
} from '../errors';
import {
  ConditionExternalJson,
  ConditionInternalLastJson,
  ConditionInternalThisJson,
  validatorQuestionnaireJson,
} from '../models/questionnaireJson';
import { ConditionType } from '../models/condition';
import { PublishMode } from '../models/routes/questionnaireImport';
import generateCustomName from '../helpers/generateCustomName';
import generateAndSetVariableNames from '../helpers/variableNameGenerator';

export async function importQuestionnaire(
  studyName: string,
  publishMode: PublishMode,
  file: string,
  manager: EntityManager = dataSource.manager
): Promise<void> {
  // parse json file
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(file);
  } catch (e) {
    throw new ImportJsonParseError();
  }

  // validate schema
  const validationResult = validatorQuestionnaireJson.validate(parsedJson);
  if (validationResult.error) {
    throw new ImportJsonSchemaError(
      validationResult.error.message,
      validationResult.error
    );
  }
  const questionnaireJson = validationResult.value;

  return await manager.transaction(async (em) => {
    const questionnaireRepo = em.getRepository(QuestionnaireEntity);
    const questionRepo = em.getRepository(Question);
    const answerOptionRepo = em.getRepository(AnswerOption);

    // check unique_custom_name
    if (questionnaireJson.custom_name) {
      const questionnaireWithSameCustomNameExists =
        await questionnaireRepo.exists({
          where: {
            studyId: studyName,
            customName: questionnaireJson.custom_name,
          },
        });
      if (questionnaireWithSameCustomNameExists) {
        throw new DuplicateQuestionnaireKeyError(
          'The custom name is already in use'
        );
      }
    }

    // generate variable names
    generateAndSetVariableNames(questionnaireJson);

    const questionnaire = questionnaireRepo.create({
      studyId: studyName,
      publish:
        publishMode === PublishMode.HIDDEN
          ? PublishMode.HIDDEN
          : questionnaireJson.publish,
      version: 1,
      active: true,
      noQuestions: questionnaireJson.questions.length,
      name: questionnaireJson.name,
      customName: questionnaireJson.custom_name,
      sortOrder: questionnaireJson.sort_order,
      cycleAmount: questionnaireJson.cycle_amount,
      cycleUnit: questionnaireJson.cycle_unit,
      activateAfterDays: questionnaireJson.activate_after_days,
      deactivateAfterDays: questionnaireJson.deactivate_after_days,
      notificationTries: questionnaireJson.notification_tries,
      notificationTitle: questionnaireJson.notification_title,
      notificationBodyNew: questionnaireJson.notification_body_new,
      notificationBodyInProgress:
        questionnaireJson.notification_body_in_progress,
      notificationWeekday: questionnaireJson.notification_weekday,
      notificationInterval: questionnaireJson.notification_interval,
      notificationIntervalUnit: questionnaireJson.notification_interval_unit,
      notificationLinkToOverview:
        questionnaireJson.notification_link_to_overview,
      activateAtDate: questionnaireJson.activate_at_date,
      complianceNeeded: questionnaireJson.compliance_needed,
      expiresAfterDays: questionnaireJson.expires_after_days,
      finalisesAfterDays: questionnaireJson.finalises_after_days,
      type: questionnaireJson.type,
      notifyWhenNotFilled: questionnaireJson.notify_when_not_filled,
      notifyWhenNotFilledTime: questionnaireJson.notify_when_not_filled_time,
      notifyWhenNotFilledDay: questionnaireJson.notify_when_not_filled_day,
      cyclePerDay: questionnaireJson.cycle_per_day,
      cycleFirstHour: questionnaireJson.cycle_first_hour,
      keepAnswers: questionnaireJson.keep_answers,
      questions: questionnaireJson.questions.map(
        (q, qIndex): Question =>
          questionRepo.create({
            isMandatory: q.is_mandatory,
            position: qIndex + 1,
            text: q.text,
            helpText: q.help_text,
            variableName: q.variable_name,
            answerOptions: q.answer_options.map(
              (ao, aoIndex): AnswerOption =>
                answerOptionRepo.create({
                  position: aoIndex + 1,
                  text: ao.text,
                  answerTypeId: ao.answer_type_id,
                  isDecimal: ao.is_decimal,
                  isNotable: ao.is_notable,
                  variableName: ao.variable_name,
                  restrictionMax: ao.restriction_max,
                  restrictionMin: ao.restriction_min,
                  values: ao.values,
                  valuesCode: ao.values_code,
                  useAutocomplete: ao.use_autocomplete,
                })
            ),
          })
      ),
    });
    await questionnaireRepo.save(questionnaire);
    if (!questionnaire.customName) {
      questionnaire.customName = generateCustomName(
        questionnaire.name,
        questionnaire.id
      );
      await questionnaireRepo.save(questionnaire);
    }

    // add questionnaire condition
    const conditionsToSave: Condition[] = [];
    if (questionnaireJson.condition) {
      const condition = await convertCondition(
        questionnaireJson.condition,
        questionnaire,
        em
      );
      condition.conditionQuestionnaire = questionnaire;
      conditionsToSave.push(condition);
    }
    assert(
      questionnaire.questions?.length === questionnaireJson.questions.length,
      'something went wrong'
    );
    for (let i = 0; i < questionnaire.questions.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion,security/detect-object-injection
      const question = questionnaire.questions[i]!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion,security/detect-object-injection
      const questionJson = questionnaireJson.questions[i]!;
      if (questionJson.condition) {
        const questionCondition = await convertCondition(
          questionJson.condition,
          questionnaire,
          em
        );
        questionCondition.conditionQuestion = question;
        conditionsToSave.push(questionCondition);
      }
      assert(
        question.answerOptions?.length === questionJson.answer_options.length,
        'something went wrong'
      );
      for (let j = 0; j < question.answerOptions.length; j++) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion,security/detect-object-injection
        const answerOption = question.answerOptions[j]!;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion,security/detect-object-injection
        const answerOptionJson = questionJson.answer_options[j]!;
        if (answerOptionJson.condition) {
          const aoCondition = await convertCondition(
            answerOptionJson.condition,
            questionnaire,
            em
          );
          aoCondition.conditionAnswerOption = answerOption;
          conditionsToSave.push(aoCondition);
        }
      }
    }
    await em.getRepository(Condition).save(conditionsToSave);
  });
}

async function convertCondition(
  condition:
    | ConditionInternalLastJson
    | ConditionInternalThisJson
    | ConditionExternalJson,
  questionnaire: QuestionnaireEntity,
  manager: EntityManager = dataSource.manager
): Promise<Condition> {
  const conditionRepo = manager.getRepository(Condition);
  const questionnaireRepo = manager.getRepository(QuestionnaireEntity);
  const answerOptionRepo = manager.getRepository(AnswerOption);

  if (condition.type === ConditionType.EXTERNAL) {
    // find target questionnaire id and answer option id by custom name and value name
    const targetQuestionnaire = await questionnaireRepo.findOne({
      where: {
        customName: condition.target_questionnaire_custom_name,
        studyId: questionnaire.studyId,
      },
      order: { version: 'DESC' }, // get latest version
    });
    if (!targetQuestionnaire) {
      throw new ImportConditionQuestionnaireReferenceError(
        'Condition references a questionnaire that does not exist'
      );
    }

    // find target answer option in target questionnaire
    const targetAnswerOption = await answerOptionRepo.findOne({
      where: {
        question: {
          questionnaire: {
            id: targetQuestionnaire.id,
            version: targetQuestionnaire.version,
          },
        },
        variableName: condition.target_answer_option_variable_name,
      },
    });
    if (!targetAnswerOption) {
      throw new ImportConditionAnswerOptionReferenceError(
        'Condition references an answer option that does not exist in the target questionnaire'
      );
    }

    // create condition
    return conditionRepo.create({
      type: condition.type,
      value: condition.value,
      link: condition.link,
      operand: condition.operand,
      targetQuestionnaire: targetQuestionnaire,
      targetAnswerOption: targetAnswerOption,
    });
  } else {
    // find answer option in current questionnaire
    const targetAnswerOption =
      questionnaire.questions?.[condition.target_question_pos - 1]
        ?.answerOptions?.[condition.target_answer_option_pos - 1];
    if (!targetAnswerOption) {
      throw new ImportConditionAnswerOptionReferenceError(
        'Internal condition references an answer option that does not exist in the this questionnaire'
      );
    }

    return conditionRepo.create({
      type: condition.type,
      value: condition.value,
      link: condition.link,
      operand: condition.operand,
      targetAnswerOption: targetAnswerOption,
      targetQuestionnaire: questionnaire,
    });
  }
}
