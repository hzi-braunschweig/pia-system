/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';

import { StudyAccessesInteractor } from '../interactors/studyAccessesInteractor';
import { StudyAccessDto } from '../models/studyAccessDto';

/**
 * HAPI Handler for study accesses
 */
export class StudyAccessesHandler {
  /**
   * Gets all study accesses of a study
   */
  public static getAll: Lifecycle.Method = async (
    request
  ): Promise<StudyAccessDto[]> => {
    return await StudyAccessesInteractor.getStudyAccesses(
      request.params['studyName'] as string
    );
  };

  /**
   * Creates the study access if the user has access
   */
  public static createOne: Lifecycle.Method = async (
    request
  ): Promise<StudyAccessDto> => {
    return await StudyAccessesInteractor.createStudyAccess({
      ...(request.payload as StudyAccessDto),
      studyName: request.params['studyName'] as string,
    });
  };

  /**
   * Updates the study access if the user has access
   */
  public static updateOne: Lifecycle.Method = async (
    request
  ): Promise<StudyAccessDto> => {
    return await StudyAccessesInteractor.updateStudyAccessLevel({
      ...(request.payload as StudyAccessDto),
      studyName: request.params['studyName'] as string,
      username: request.params['username'] as string,
    });
  };

  /**
   * Deletes the study access if the user has access
   */
  public static deleteOne: Lifecycle.Method = async (
    request
  ): Promise<null> => {
    await StudyAccessesInteractor.deleteStudyAccess(
      request.params['studyName'] as string,
      request.params['username'] as string
    );
    return null;
  };
}
