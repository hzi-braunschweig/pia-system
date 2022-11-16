/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getRepository } from 'typeorm';
import { StudyWelcomeMail } from '../entities/studyWelcomeMail';
import {
  StudyWelcomeMailContent,
  StudyWelcomeMailTemplateRequestDto,
  StudyWelcomeMailTemplateResponseDto,
} from '../models/studyWelcomeEmail';
import {
  HtmlParser,
  HtmlSerializer,
  MarkdownCompiler,
  MarkdownDocument,
  TemplateRenderer,
} from '@pia/lib-templatepipeline';
import { defaultStudyWelcomeMail } from './studyWelcomeMail/defaultStudyWelcomeMail';
import { PiaPseudonymTag } from './studyWelcomeMail/piaPseudonymTag';
import { ProbandService } from './probandService';

export class StudyWelcomeMailService {
  private static readonly pseudonymHtmlTag = 'pia-pseudonym';

  public static async getStudyWelcomeMailContent(
    pseudonym: string
  ): Promise<StudyWelcomeMailContent> {
    const { study } = await ProbandService.getProbandByPseudonymOrFail(
      pseudonym
    );

    const welcomeMail = await this.getStudyWelcomeMailTemplate(study);

    return {
      subject: welcomeMail.subject,
      html: await this.convertMarkdownToHtmlText(
        pseudonym,
        welcomeMail.markdownText
      ),
    };
  }

  public static async updateStudyWelcomeMailTemplate(
    studyName: string,
    welcomeMail: StudyWelcomeMailTemplateRequestDto
  ): Promise<StudyWelcomeMailTemplateResponseDto> {
    return await getRepository(StudyWelcomeMail).save({
      studyName,
      ...welcomeMail,
    });
  }

  public static async getStudyWelcomeMailTemplate(
    studyName: string
  ): Promise<StudyWelcomeMailTemplateResponseDto> {
    return (
      (await getRepository(StudyWelcomeMail).findOne(studyName)) ??
      this.getDefaultWelcomeMail(studyName)
    );
  }

  private static getDefaultWelcomeMail(
    studyName: string
  ): StudyWelcomeMailTemplateResponseDto {
    return {
      studyName,
      ...defaultStudyWelcomeMail,
    };
  }

  private static async convertMarkdownToHtmlText(
    pseudonym: string,
    markdownText: string
  ): Promise<string> {
    return await new MarkdownDocument(markdownText)
      .pipe(new MarkdownCompiler([this.pseudonymHtmlTag]))
      .pipe(new HtmlParser())
      .pipe(new PiaPseudonymTag())
      .pipe(new HtmlSerializer())
      .pipe(new TemplateRenderer({ pseudonym })).htmlText;
  }
}
