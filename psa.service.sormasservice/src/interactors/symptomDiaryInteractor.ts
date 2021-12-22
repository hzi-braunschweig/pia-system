/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  DeactivateProbandResponse,
  RegisterProbandResponse,
  UpdateProbandResponse,
  ViewProbandModel,
} from '../models/symptomDiary';
import { userserviceClient } from '../clients/userserviceClient';
import { JournalPersonDto } from '../models/sormas';
import { config } from '../config';
import {
  ProbandInternalDto,
  ProbandRequestInternalDto,
  ProbandResponseInternalDto,
  ProbandStatus,
} from '@pia-system/lib-http-clients-internal';
import { createSormasRegistrationMail } from '../services/mailTemplateService';
import { I18n } from 'i18n';
import { SymptomDiaryService } from '../services/symptomDiaryService';
import Boom from '@hapi/boom';
import {
  ProbandNotFoundError,
  SormasFetchPersonError,
  UpdateFollowUpError,
  UpdatePersonalDataError,
} from '../errors';
import { MailService, sanitizeHtml } from '@pia/lib-service-core';
import { getRepository } from 'typeorm';
import { FollowUp } from '../entities/followUp';

export class SymptomDiaryInteractor {
  public static async registerProband(
    personUuid: string,
    i18n: I18n
  ): Promise<RegisterProbandResponse> {
    // Generate free pseudonym
    let generatedPseudonym: string;
    try {
      generatedPseudonym = await SymptomDiaryService.generateNewPseudonym(
        config.sormas.study
      );
    } catch (e) {
      console.warn(e);
      return {
        success: false,
        message: i18n.__('NEW_PROBAND_ERROR_GENERATING_PSEUDONYM'),
      };
    }

    // Register person
    let proband: ProbandResponseInternalDto;
    try {
      const newProband: ProbandRequestInternalDto = {
        pseudonym: generatedPseudonym,
        ids: personUuid,
        complianceLabresults: false,
        complianceBloodsamples: false,
        complianceSamples: false,
        studyCenter: null,
        examinationWave: 0,
      };
      proband = await userserviceClient.registerProband(
        config.sormas.study,
        newProband
      );
    } catch (e) {
      console.warn(e);
      return {
        success: false,
        message: i18n.__('NEW_PROBAND_ERROR_REGISTERING'),
      };
    }

    // Update follow up and personal data
    let person: JournalPersonDto;
    try {
      person = await SymptomDiaryService.updateProbandDataFromSormas({
        pseudonym: generatedPseudonym,
        personUuid: personUuid,
      });
    } catch (e) {
      console.warn(e);
      await userserviceClient
        .deleteProbanddata(generatedPseudonym, false, true)
        .catch(console.error);
      if (e instanceof SormasFetchPersonError) {
        return {
          success: false,
          message: i18n.__('NEW_PROBAND_ERROR_FETCHING_DATA'),
        };
      } else if (e instanceof UpdatePersonalDataError) {
        return {
          success: false,
          message: i18n.__('NEW_PROBAND_ERROR_EMAIL_NOT_VALID'),
        };
      } else if (e instanceof UpdateFollowUpError) {
        return {
          success: false,
          message: i18n.__('NEW_PROBAND_COULD_NOT_SAVE_FOLLOW_UP_ENDDATE'),
        };
      } else {
        throw Boom.boomify(e as Error);
      }
    }

    // Send password via mail
    let success: boolean;
    try {
      const mailContent = createSormasRegistrationMail(proband.password);
      success = await MailService.sendMail(person.emailAddress, mailContent);
    } catch (e) {
      console.warn(e);
      success = false;
    }
    if (!success) {
      return {
        success: true,
        message: i18n.__('NEW_PROBAND_SUCCESS_WITH_EMAIL_ERROR_MESSAGE', {
          pseudonym: proband.pseudonym,
          password: proband.password,
        }),
      };
    }

    // Respond with new created username
    return {
      success: true,
      message: i18n.__('NEW_PROBAND_SUCCESS_MESSAGE', {
        pseudonym: proband.pseudonym,
      }),
    };
  }

  public static async updateProband(
    personUuid: string,
    i18n: I18n
  ): Promise<UpdateProbandResponse> {
    // Update follow up and personal data
    try {
      await SymptomDiaryService.updateProbandDataFromSormas({
        personUuid: personUuid,
      });
    } catch (e) {
      console.warn(e);
      if (e instanceof ProbandNotFoundError) {
        throw Boom.notFound(
          'This participant does not exist in the symptomdiary'
        );
      } else if (e instanceof SormasFetchPersonError) {
        return {
          success: false,
          message: i18n.__('UPDATE_PROBAND_ERROR_FETCHING_DATA'),
          errors: {},
        };
      } else if (e instanceof UpdatePersonalDataError) {
        return {
          success: false,
          message: i18n.__('UPDATE_PROBAND_ERROR_EMAIL_NOT_VALID'),
          errors: {},
        };
      } else if (e instanceof UpdateFollowUpError) {
        return {
          success: false,
          message: i18n.__('UPDATE_PROBAND_COULD_NOT_SAVE_FOLLOW_UP_ENDDATE'),
          errors: {},
        };
      } else {
        throw Boom.boomify(e as Error);
      }
    }

    // Respond with success message
    return {
      success: true,
      message: i18n.__('UPDATE_PROBAND_SUCCESS_MESSAGE'),
      errors: {},
    };
  }

  public static async deactivateProband(
    personUuid: string,
    i18n: I18n
  ): Promise<DeactivateProbandResponse> {
    let proband: ProbandInternalDto | null;
    try {
      proband = await userserviceClient.getProbandByIDS(personUuid);
    } catch (err) {
      console.warn(err);
      return {
        success: false,
        message: i18n.__('DEACTIVATE_PROBAND_INTERNAL_ERROR'),
      };
    }
    if (!proband) {
      return {
        success: false,
        message: i18n.__('DEACTIVATE_PROBAND_NOT_FOUND_ERROR'),
      };
    }
    try {
      await userserviceClient.patchProband(proband.pseudonym, {
        status: ProbandStatus.DEACTIVATED,
      });
      await SymptomDiaryService.stopFollowUpOfProband(proband.pseudonym);
    } catch (err) {
      console.warn(err);
      return {
        success: false,
        message: i18n.__('DEACTIVATE_PROBAND_INTERNAL_ERROR'),
      };
    }
    return {
      success: true,
      message: i18n.__('DEACTIVATE_PROBAND_SUCCESS'),
    };
  }

  public static async getProbandViewData(
    personUuid: string
  ): Promise<ViewProbandModel> {
    const proband = await userserviceClient.getProbandByIDS(personUuid);
    if (!proband) {
      throw Error('Proband not found.');
    }
    const { pseudonym } = proband;
    const followUp = await getRepository(FollowUp).findOne({ pseudonym });
    return {
      pseudonym: sanitizeHtml(pseudonym),
      followUpEndDate: followUp?.endDate ?? null,
    };
  }
}
