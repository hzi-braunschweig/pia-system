/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PipeSection } from './PipeSection';
import { render } from 'mustache';
import { HtmlDocument } from '../template-documents';

export class TemplateRenderer
  implements PipeSection<HtmlDocument, HtmlDocument>
{
  public entity: Record<string, unknown> | null;

  public constructor(entity: Record<string, unknown> | null) {
    this.entity = entity;
  }

  public execute(input: HtmlDocument): HtmlDocument {
    return new HtmlDocument(this.renderTemplate(input.htmlText));
  }

  private async renderTemplate(htmlText: Promise<string>): Promise<string> {
    return render(await htmlText, this.entity);
  }
}
