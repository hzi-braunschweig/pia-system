/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
// The following ignores are needed as DOMPurify type definitions do not support JSDOM, but the lib itself does
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const DOMPurify = createDOMPurify(window);

/**
 * Sanitizes HTML and prevents XSS attacks
 *
 * @description
 * Will strip out everything that contains dangerous HTML and thereby prevents XSS attacks and other nastiness.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
