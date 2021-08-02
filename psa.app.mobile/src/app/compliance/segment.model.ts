/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export enum SegmentType {
  HTML = 'HTML',
  CUSTOM_TAG = 'CUSTOM_TAG',
}

export type TemplateSegment = HtmlSegment | CustomTagSegment;

interface TemplateSegmentI {
  readonly type: SegmentType;
}

export interface HtmlSegment extends TemplateSegmentI {
  readonly type: SegmentType.HTML;
  html: string;
}

export interface Attribute {
  name: string;
  value: string;
}

export interface CustomTagSegment extends TemplateSegmentI {
  readonly type: SegmentType.CUSTOM_TAG;
  readonly tagName: string;
  readonly attrs: Attribute[];
  readonly children: TemplateSegment[];
}

function isObject(instance: unknown): instance is Record<string, unknown> {
  return instance !== null && typeof instance === 'object';
}

export function isTemplateSegment(
  instance: unknown
): instance is TemplateSegment {
  return (
    isObject(instance) &&
    (instance.type === SegmentType.HTML ||
      instance.type === SegmentType.CUSTOM_TAG)
  );
}
