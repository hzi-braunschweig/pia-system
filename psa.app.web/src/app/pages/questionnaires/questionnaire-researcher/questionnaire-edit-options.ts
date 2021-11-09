/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface EditOption {
  value: string;
  viewValue: string;
}

export class QuestionnaireEditOptions {
  public static readonly conditionLinks: QuestionnaireEditOptions[] = [
    { value: 'OR', viewValue: 'OR' },
    { value: 'AND', viewValue: 'AND' },
    { value: 'XOR', viewValue: 'XOR' },
  ];

  public static readonly conditionOperands: QuestionnaireEditOptions[] = [
    { id: 1, viewValue: '<' },
    { id: 2, viewValue: '<=' },
    { id: 3, viewValue: '==' },
    { id: 4, viewValue: '>' },
    { id: 5, viewValue: '>=' },
    { id: 6, viewValue: '\\=' },
  ];

  public static readonly conditionTypes: QuestionnaireEditOptions[] = [
    { value: 'external', viewValue: 'QUESTIONNAIRE_FORSCHER.CONDITION_EXTERN' },
    {
      value: 'internal_last',
      viewValue: 'QUESTIONNAIRE_FORSCHER.CONDITION_LAST',
    },
    {
      value: 'internal_this',
      viewValue: 'QUESTIONNAIRE_FORSCHER.CONDITION_THIS',
    },
  ];

  public static readonly conditionTypesForQuestionnaire: QuestionnaireEditOptions[] =
    [
      {
        value: 'external',
        viewValue: 'QUESTIONNAIRE_FORSCHER.CONDITION_EXTERN',
      },
    ];

  public static readonly questionnaireTypes: QuestionnaireEditOptions[] = [
    {
      value: 'for_probands',
      viewValue: 'QUESTIONNAIRE_FORSCHER.TYPE_FOR_PROBANDS',
    },
    {
      value: 'for_research_team',
      viewValue: 'QUESTIONNAIRE_FORSCHER.TYPE_FOR_RESEARCH_TEAM',
    },
  ];

  public static readonly answerTypes: QuestionnaireEditOptions[] = [
    {
      id: 1,
      value: 'array_single',
      viewValue: 'QUESTIONNAIRE_FORSCHER.ARRAY_SINGLE',
      availableFor: ['for_probands', 'for_research_team'],
    },
    {
      id: 2,
      value: 'array_multi',
      viewValue: 'QUESTIONNAIRE_FORSCHER.ARRAY_MULTI',
      availableFor: ['for_probands', 'for_research_team'],
    },
    {
      id: 3,
      value: 'number',
      viewValue: 'QUESTIONNAIRE_FORSCHER.NUMBER',
      availableFor: ['for_probands', 'for_research_team'],
    },
    {
      id: 4,
      value: 'string',
      viewValue: 'QUESTIONNAIRE_FORSCHER.STRING',
      availableFor: ['for_probands', 'for_research_team'],
    },
    {
      id: 5,
      value: 'date',
      viewValue: 'QUESTIONNAIRE_FORSCHER.DATE',
      availableFor: ['for_probands', 'for_research_team'],
    },
    {
      id: 6,
      value: 'sample',
      viewValue: 'QUESTIONNAIRE_FORSCHER.SAMPLE',
      availableFor: ['for_probands', 'for_research_team'],
    },
    {
      id: 7,
      value: 'pzn',
      viewValue: 'QUESTIONNAIRE_FORSCHER.PZN',
      availableFor: ['for_probands', 'for_research_team'],
    },
    {
      id: 8,
      value: 'image',
      viewValue: 'QUESTIONNAIRE_FORSCHER.IMAGE',
      availableFor: ['for_probands', 'for_research_team'],
    },
    {
      id: 9,
      value: 'date_time',
      viewValue: 'QUESTIONNAIRE_FORSCHER.DATE_TIME',
      availableFor: ['for_probands', 'for_research_team'],
    },
    {
      id: 10,
      value: 'file',
      viewValue: 'QUESTIONNAIRE_FORSCHER.FILE',
      availableFor: ['for_research_team'],
    },
  ];

  public static readonly cycleUnits: QuestionnaireEditOptions[] = [
    { value: 'once', viewValue: 'QUESTIONNAIRE_FORSCHER.ONCE' },
    { value: 'hour', viewValue: 'QUESTIONNAIRE_FORSCHER.HOUR' },
    { value: 'day', viewValue: 'QUESTIONNAIRE_FORSCHER.DAY' },
    { value: 'week', viewValue: 'QUESTIONNAIRE_FORSCHER.WEEK' },
    { value: 'month', viewValue: 'QUESTIONNAIRE_FORSCHER.MONTH' },
    { value: 'date', viewValue: 'QUESTIONNAIRE_FORSCHER.DATE' },
    { value: 'spontan', viewValue: 'QUESTIONNAIRE_FORSCHER.SPONTANEOUS' },
  ];

  public static readonly hoursOfDay: QuestionnaireEditOptions[] = [];

  public static readonly hoursPerDay: number[] = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23, 24,
  ];

  public static readonly publishOptions: QuestionnaireEditOptions[] = [
    { value: 'hidden', viewValue: 'QUESTIONNAIRE_FORSCHER.HIDDEN' },
    { value: 'testprobands', viewValue: 'QUESTIONNAIRE_FORSCHER.TESTPROBANDS' },
    { value: 'allaudiences', viewValue: 'QUESTIONNAIRE_FORSCHER.ALLAUDIENCES' },
  ];

  public static getHoursOfDay(timePostfix: string): QuestionnaireEditOptions[] {
    return [...Array(24).keys()].map((hour) => ({
      value: hour,
      viewValue: `${hour < 10 ? '0' : ''}${hour} ${timePostfix}`,
    }));
  }
}
