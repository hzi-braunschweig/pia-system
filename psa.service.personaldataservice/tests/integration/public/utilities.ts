/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  CycleUnit,
  QuestionnaireInstanceStatus,
  QuestionnaireType,
} from '@pia-system/lib-http-clients-internal';
import { db } from '../../../src/db';

export async function waitForConditionToBeTrue(
  conditionFn: () => boolean,
  tries = 3,
  timeout = 50
): Promise<void> {
  return new Promise<void>((resolve) => {
    let count = 0;
    const handler = (): unknown =>
      conditionFn() || count > tries ? resolve() : count++;

    setInterval(handler, timeout);
  });
}

export function sprintPath(
  path: string,
  segments: Record<string, string | number>
): string {
  // eslint-disable-next-line security/detect-non-literal-regexp
  const regex = new RegExp(`{${Object.keys(segments).join('}|{')}}`, 'g');
  return path.replace(regex, function (matched) {
    const key = matched.replace(/}|{/g, '');
    return key in segments ? String(segments[String(key)]) : matched;
  });
}

export async function setQuestionnaireType(
  id: number,
  type: QuestionnaireType
): Promise<void> {
  await db.none(
    'UPDATE questionnaires SET type = ${type} WHERE id = ${instanceId}',
    { instanceId: id, type }
  );
}

export async function setQuestionnaireCycleUnit(
  id: number,
  cycleUnit: CycleUnit
): Promise<void> {
  await db.none(
    'UPDATE questionnaires SET cycle_unit = ${cycleUnit} WHERE id = ${instanceId}',
    { instanceId: id, cycleUnit }
  );
}

export async function setQuestionnaireInstanceStatus(
  instanceId: number,
  status: QuestionnaireInstanceStatus,
  releaseVersion?: number
): Promise<void> {
  let setReleaseVersion = '';
  if (releaseVersion) {
    setReleaseVersion = ', release_version = ${releaseVersion}';
  }

  await db.none(
    'UPDATE questionnaire_instances SET status = ${status}' +
      setReleaseVersion +
      ' WHERE id = ${instanceId}',
    { instanceId, status, releaseVersion }
  );
}
