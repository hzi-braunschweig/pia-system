/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const TemplateSegmentTypes = {
  MARKDOWN_TEMPLATE: 'MARKDOWN_TEMPLATE', // Template with Markdown, Mustache and placeholders
  HTML_TEMPLATE: 'HTML_TEMPLATE', // Template with HTML, Mustache and placeholders
  HTML: 'HTML', // HTML with placeholders and Mustache placeholders replaced by actual values
  PLACEHOLDER: 'PLACEHOLDER', // Description of a segment which needs to be converted afterwards
};

module.exports = Object.freeze(TemplateSegmentTypes);
