/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { faker } from '@faker-js/faker/locale/de';
import {
  Proband,
  ProfessionalRole,
  ProfessionalUser,
} from '../models/user.model';
import { Study } from '../models/study.model';
import {
  Answer,
  AnswerOption,
  AnswerOptionId,
  Answers,
  Questionnaire,
  QuestionnaireInstance,
} from '../models/questionnaire.model';
import { BloodSample } from '../models/blood-sample.model';

export class RandomDataService {
  static studyPrefix = 'API';

  static getRandomProfessionalUser(
    role: ProfessionalRole,
    studyId: string
  ): ProfessionalUser {
    return {
      username: this.studyPrefix + '-' + faker.internet.email(),
      role: role,
      study_accesses: [{ study_id: studyId, access_level: 'admin' }],
    };
  }

  static getRandomProband(): Proband {
    return {
      pseudonym: this.studyPrefix + '-Proband-' + faker.datatype.uuid(),
      complianceLabresults: faker.datatype.boolean(),
      complianceSamples: faker.datatype.boolean(),
      complianceBloodsamples: faker.datatype.boolean(),
      studyCenter: 'Testdaten Studienzentrum',
      examinationWave: faker.datatype.number(10),
      origin: 'investigator',
    };
  }

  static getRandomStudy(): Study {
    return {
      name: this.studyPrefix + '-Teststudie-' + faker.datatype.uuid(),
      description: 'Studie zu reinen Testzwecken',
      pm_email: null,
      hub_email: null,
      has_required_totp: false,
      has_open_self_registration: false,
    };
  }

  static getRandomBloodSample(): BloodSample {
    return {
      remark: faker.lorem.sentence(),
      blood_sample_carried_out: faker.datatype.boolean(),
    };
  }

  static getRandomQuestionnaire(studyId: string): Questionnaire {
    return {
      study_id: studyId,
      name: this.studyPrefix + '-Fragebogen-' + faker.datatype.uuid(),
      type: 'for_probands',
      cycle_amount: 1,
      activate_at_date: null,
      cycle_unit: 'day',
      cycle_per_day: null,
      cycle_first_hour: null,
      publish: 'allaudiences',
      activate_after_days: 0,
      deactivate_after_days: 60,
      notification_tries: 0,
      notification_title: 'COVID-19 Symptome',
      notification_weekday: null,
      notification_interval: null,
      notification_interval_unit: null,
      notification_body_new: 'Welche Beschwerden haben Sie?',
      notification_body_in_progress:
        'Bitte vervollständigen Sie Ihren Symptomfragebogen!',
      compliance_needed: false,
      notify_when_not_filled: false,
      notify_when_not_filled_time: null,
      notify_when_not_filled_day: null,
      expires_after_days: 60,
      finalises_after_days: 2,
      questions: [
        {
          text: '**Bitte geben Sie an, inwieweit die folgenden Beschwerden Sie innerhalb der letzten 24 Stunden neu betroffen haben.** Bitte geben Sie keine Beschwerden an, die aufgrund einer Allergie aufgetreten sind. \nDieser Fragebogen bezieht sich auf die von Ihnen am (dat=0) gemeldeten Symptome. ',
          variable_name: '',
          position: 1,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: 'Husten?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 2,
              text: 'Ich hatte Husten...',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Mit Auswurf' }, { value: 'Ohne Auswurf' }],
              values_code: [{ value: 1 }, { value: 0 }],
              condition: {
                condition_target_questionnaire_version: 1,
                condition_type: 'internal_this',
                condition_target_questionnaire: -1,
                condition_target_answer_option: -1,
                condition_target_question_pos: 1,
                condition_target_answer_option_pos: 1,
                condition_operand: '==',
                condition_value: 'Ja',
                condition_link: 'OR',
              },
            },
            {
              position: 3,
              text: 'Der Auswurf des Husten ist:',
              variable_name: '',
              answer_type_id: 2,
              is_notable: [],
              values: [
                { value: 'Grün/gelblich' },
                { value: 'Weißlich/glasig' },
                { value: 'Blutig' },
              ],
              values_code: [{ value: 0 }, { value: 1 }, { value: 2 }],
              condition: {
                condition_target_questionnaire_version: 1,
                condition_type: 'internal_this',
                condition_target_questionnaire: -1,
                condition_target_answer_option: -1,
                condition_target_question_pos: 1,
                condition_target_answer_option_pos: 2,
                condition_operand: '==',
                condition_value: 'Mit Auswurf',
                condition_link: 'OR',
              },
            },
            {
              position: 4,
              text: 'Verstopfte Nase?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 5,
              text: 'Laufende Nase?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 6,
              text: 'Welche Farbe hat das Nasensekret?',
              variable_name: '',
              answer_type_id: 2,
              is_notable: [],
              values: [
                { value: 'Grün/gelblich' },
                { value: 'Weißlich/glasig' },
                { value: 'Blutig' },
              ],
              values_code: [{ value: 0 }, { value: 1 }, { value: 2 }],
              condition: {
                condition_target_questionnaire_version: 1,
                condition_type: 'internal_this',
                condition_target_questionnaire: -1,
                condition_target_answer_option: -1,
                condition_target_question_pos: 1,
                condition_target_answer_option_pos: 5,
                condition_operand: '==',
                condition_value: 'Ja',
                condition_link: 'OR',
              },
            },
            {
              position: 7,
              text: 'Niesen?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 8,
              text: 'Halsschmerzen?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 9,
              text: 'Kopfschmerzen?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 10,
              text: 'Ohrenschmerzen?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 11,
              text: 'Allgemeines Unwohlsein/Krankheitsgefühl?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 12,
              text: 'Gliederschmerzen?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 13,
              text: 'Kältegefühl/Frösteln?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 14,
              text: 'Kurzatmigkeit?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [
                { value: 'Ja, ständig' },
                { value: 'Ja, beim Husten' },
                { value: 'Ja, unter Belastung' },
                { value: 'Nein' },
              ],
              values_code: [
                { value: 0 },
                { value: 1 },
                { value: 2 },
                { value: 3 },
              ],
            },
            {
              position: 15,
              text: 'Tränende Augen?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 16,
              text: 'Brennende und/oder juckende Augen?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 17,
              text: 'Raue Stimme/Heiserkeit?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 18,
              text: 'Vorübergehender Verlust der Stimme?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 19,
              text: 'Druckgefühl im Gesicht?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 20,
              text: 'Zahnschmerzen?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 21,
              text: 'Geruchs- und Geschmacksverlust?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 22,
              text: 'Bindehautentzündung?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 23,
              text: 'Hautausschlag?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 24,
              text: 'Lymphknotenschwellung?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 25,
              text: 'Benommenheit/ungewöhnliche Schläfrigkeit?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 26,
              text: 'Erhöhte Temperatur/Fieber?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [
                { value: 'Ja, gemessen' },
                { value: 'Ja, eigenes Empfinden (nicht gemessen)' },
                { value: 'Nein' },
              ],
              values_code: [{ value: 1 }, { value: 2 }, { value: 0 }],
            },
            {
              position: 27,
              text: 'Wie hoch war die höchste Temperatur?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [
                { value: 'Unter 38°C' },
                { value: '38-39°C' },
                { value: 'Über 39°C' },
              ],
              values_code: [{ value: 0 }, { value: 1 }, { value: 2 }],
              condition: {
                condition_target_questionnaire_version: 1,
                condition_type: 'internal_this',
                condition_target_questionnaire: -1,
                condition_target_answer_option: -1,
                condition_target_question_pos: 1,
                condition_target_answer_option_pos: 26,
                condition_operand: '==',
                condition_value: 'Ja, gemessen',
                condition_link: 'OR',
              },
            },
            {
              position: 28,
              text: 'Wo wurde gemessen?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [
                { value: 'An der Stirn' },
                { value: 'Im Ohr' },
                { value: 'Unter der Zunge' },
                { value: 'Unter der Achsel' },
                { value: 'Im Po' },
              ],
              values_code: [
                { value: 0 },
                { value: 1 },
                { value: 2 },
                { value: 3 },
                { value: 4 },
              ],
              condition: {
                condition_target_questionnaire_version: 1,
                condition_type: 'internal_this',
                condition_target_questionnaire: -1,
                condition_target_answer_option: -1,
                condition_target_question_pos: 1,
                condition_target_answer_option_pos: 27,
                condition_operand: '==',
                condition_value: 'Unter 38°C;38-39°C;Über 39°C',
                condition_link: 'OR',
              },
            },
            {
              position: 29,
              text: 'Wann wurde gemessen? Wenn Sie sich nicht erinnern, dann überspringen Sie die Frage.',
              variable_name: '',
              answer_type_id: 5,
              is_notable: [],
              values: [],
              values_code: [],
              condition: {
                condition_target_questionnaire_version: 1,
                condition_type: 'internal_this',
                condition_target_questionnaire: -1,
                condition_target_answer_option: -1,
                condition_target_question_pos: 1,
                condition_target_answer_option_pos: 27,
                condition_operand: '==',
                condition_value: 'Unter 38°C;38-39°C;Über 39°C',
                condition_link: 'OR',
              },
            },
            {
              position: 30,
              text: 'Übelkeit/Erbrechen?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 31,
              text: 'Durchfall?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 32,
              text: 'Sie haben Durchfall angegeben. Welcher der folgenden Aussagen stimmen Sie zu?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [
                {
                  value:
                    'Ich hatte ein- bis zweimal flüssigen/breiigen Stuhlgang in 24 Std..',
                },
                {
                  value:
                    'Ich hatte mind. dreimal flüssigen/breiigen  Stuhlgang in 24 Std..',
                },
              ],
              values_code: [{ value: 0 }, { value: 1 }],
              condition: {
                condition_target_questionnaire_version: 1,
                condition_type: 'internal_this',
                condition_target_questionnaire: -1,
                condition_target_answer_option: -1,
                condition_target_question_pos: 1,
                condition_target_answer_option_pos: 31,
                condition_operand: '==',
                condition_value: 'Ja',
                condition_link: 'OR',
              },
            },
            {
              position: 33,
              text: 'Bauchschmerzen?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 34,
              text: 'Andere Beschwerden?',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [{ value: 'Ja' }, { value: 'Nein' }],
              values_code: [{ value: 1 }, { value: 0 }],
            },
            {
              position: 35,
              text: 'Welche anderen Beschwerden sind aufgetreten?',
              variable_name: '',
              answer_type_id: 4,
              is_notable: [],
              values: [],
              values_code: [],
              condition: {
                condition_target_questionnaire_version: 1,
                condition_type: 'internal_this',
                condition_target_questionnaire: -1,
                condition_target_answer_option: -1,
                condition_target_question_pos: 1,
                condition_target_answer_option_pos: 34,
                condition_operand: '==',
                condition_value: 'Ja',
                condition_link: 'OR',
              },
            },
          ],
        },
        {
          text: 'Wann sind Ihre Beschwerden zum ersten Mal aufgetreten? Wenn Sie sich nicht erinnern, dann überspringen Sie die Frage.',
          variable_name: '',
          position: 2,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: '',
              variable_name: '',
              answer_type_id: 5,
              is_notable: [],
              values: [],
              values_code: [],
              restriction_min: -14,
              restriction_max: 0,
              is_decimal: false,
            },
          ],
        },
        {
          text: 'Sind gleichzeitig, kurz vor Ihnen oder kurz nach Ihnen (bis zu einem Abstand von 2 Tagen) Personen, die mit Ihnen in einem Haushalt leben an einer Atemwegsinfektion erkrankt?',
          variable_name: '',
          position: 3,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: '',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [
                { value: 'Ich lebe allein.' },
                {
                  value:
                    'Nein, es ist außer mir keine andere Person in meinem Haushalt erkrankt.',
                },
                {
                  value:
                    'Ja, es sind weitere Personen aus meinem Haushalt erkrankt.',
                },
              ],
              values_code: [{ value: 0 }, { value: 1 }, { value: 2 }],
            },
          ],
        },
        {
          text: 'Hatten Sie Kontakt zu einem bestätigten Covid-19-Fall bis max. 14 Tage vor Krankheitsbeginn?',
          variable_name: '',
          position: 4,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: '',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [
                { value: 'Ja' },
                { value: 'Nein' },
                { value: 'Weiß ich nicht' },
              ],
              values_code: [{ value: 0 }, { value: 1 }, { value: 2 }],
            },
          ],
        },
        {
          text: 'Wurden Sie auf Corona getestet? [Stand 13.03.2020, Hinweis: Nicht jede Erkältung muss auf Corona untersucht werden.]',
          variable_name: '',
          position: 5,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: '',
              variable_name: '',
              answer_type_id: 1,
              is_notable: [],
              values: [
                { value: 'Ja, positiv' },
                { value: 'Ja, negativ' },
                { value: 'Ja, Testergebnis steht noch aus' },
                { value: 'Nein' },
              ],
              values_code: [
                { value: 0 },
                { value: 1 },
                { value: 2 },
                { value: 3 },
              ],
            },
            {
              position: 2,
              text: 'Wann wurden Sie getestet?',
              variable_name: '',
              answer_type_id: 5,
              is_notable: [],
              values: [],
              values_code: [],
              condition: {
                condition_target_questionnaire_version: 1,
                condition_type: 'internal_this',
                condition_target_questionnaire: -1,
                condition_target_answer_option: -1,
                condition_target_question_pos: 5,
                condition_target_answer_option_pos: 1,
                condition_operand: '==',
                condition_value:
                  'Ja, positiv;Ja, negativ;Ja, Testergebnis steht noch aus',
                condition_link: 'OR',
              },
              restriction_min: -365,
              restriction_max: 0,
              is_decimal: false,
            },
          ],
        },
        {
          text: 'Was denken Sie: Warum sind Sie krank geworden?',
          variable_name: '',
          position: 6,
          is_mandatory: false,
          answer_options: [
            {
              position: 1,
              text: '',
              variable_name: '',
              answer_type_id: 4,
              is_notable: [],
              values: [],
              values_code: [],
            },
          ],
        },
        {
          text: 'Bitte beachten: Eine Studienteilnahme ersetzt keinen Arztbesuch. Bitte wenden Sie sich bei gesundheitlichen Problemen an Ihren Arzt/Ihre Ärztin! Vielen Dank für Ihre Angaben. Wir wünschen Ihnen gute Besserung! Bitte gehen Sie zur nächsten Seite, um den Fragebogen abzuschicken.',
          variable_name: '',
          position: 7,
          is_mandatory: false,
          answer_options: [],
        },
      ],
    };
  }

  static getRandomAnswers(
    questionnaireInstance: QuestionnaireInstance
  ): Answers {
    const answers = questionnaireInstance.questionnaire.questions
      .map((question) =>
        question.answer_options.map((option) =>
          this.randomlyPickAnswer(question.id as number, option)
        )
      )
      .flat();

    return { answers };
  }

  private static randomlyPickAnswer(
    questionId: number,
    answerOption: AnswerOption
  ): Answer {
    let value;
    switch (answerOption.answer_type_id) {
      case AnswerOptionId.ArraySingle:
        value = faker.helpers.arrayElement(answerOption.values);
        break;
      case AnswerOptionId.ArrayMulti:
        value = answerOption.values.filter(faker.datatype.boolean).join(',');
        break;
      case AnswerOptionId.String:
        value = 'this is the best answer you can give';
        break;
      case AnswerOptionId.Date:
        value = faker.date.recent();
        break;
      default:
        throw new Error(
          'AnswerOption ' + answerOption.answer_type_id + ' not yet implemented'
        );
    }

    return {
      question_id: questionId,
      answer_option_id: answerOption.id,
      value: value,
    };
  }
}
