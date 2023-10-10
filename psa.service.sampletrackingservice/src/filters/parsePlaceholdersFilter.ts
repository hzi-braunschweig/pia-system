/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { parse, ParsedElement } from 'himalaya';

import { TEMPLATE_SEGMENT_TYPES } from './templateSegmentTypes';
import { TemplateParseError } from './errors/templateParseError';
import { PipelineDocument } from './model/pipelineDocument';
import { Segment } from './model/segment';
import { SegmentElement } from './model/segmentElement';

const consumesType = TEMPLATE_SEGMENT_TYPES.HTML_TEMPLATE;
const producesType = TEMPLATE_SEGMENT_TYPES.PLACEHOLDER;

/**
 * Finds placeholder within HTML templates and converts them
 * to placeholder segments which can be converted by other filters
 *
 * @param segment Segment in which placeholders should be parsed
 * @returns {*}
 */
function parsePlaceholders(segment: Segment): Segment[] | Segment {
  if (segment.type !== consumesType) {
    return segment;
  }
  const splittedSegments: Segment[] = [];
  const placeholderSplitter = /<(pia-[a-z-]+)[\s\S]*?>[\s\S]*?<\/\1>/gm;

  let start = 0;
  let match = placeholderSplitter.exec(segment.content);
  while (match) {
    const placeholder = match[0];
    if (!placeholder) {
      throw new TemplateParseError('Could not parse placeholder string');
    }
    splittedSegments.push({
      type: consumesType,
      content: segment.content.substring(start, match.index),
    });
    splittedSegments.push({
      type: producesType,
      element: parsePlaceholder(placeholder),
      content: '',
    });
    start = placeholderSplitter.lastIndex;
    match = placeholderSplitter.exec(segment.content);
  }
  const remainingContent = segment.content.substring(
    start,
    segment.content.length
  );
  if (remainingContent.length) {
    splittedSegments.push({
      type: consumesType,
      content: remainingContent,
    });
  }
  return splittedSegments;
}

/**
 * Parses placeholder element from text to a specific
 * placeholder element description
 *
 * @param placeholderText the text for one
 * @returns {{children: *[], name: *, attributes: *}}
 */
function parsePlaceholder(placeholderText: string): SegmentElement {
  const parsed = parse(placeholderText);
  if (!parsed || parsed.length === 0) {
    throw new TemplateParseError('Could not parse placeholder string');
  }
  const first = parsed[0];
  if (!first) {
    throw new TemplateParseError('Could not parse placeholder string');
  }
  return convertPlaceholderElement(first);
}

/**
 * Converts a parsed placeholder element to a specific
 * placeholder element description
 *
 * @param element Parsed element
 * @returns {{children: *[], name: *, attributes: *}}
 */
function convertPlaceholderElement(element: ParsedElement): SegmentElement {
  return {
    name: element.tagName,
    attributes: element.attributes.map((attr) => ({
      key: attr.key,
      value: attr.value,
    })),
    children: (element.children ?? [])
      .filter((child) => child.type === 'element')
      .map((child) => convertPlaceholderElement(child)),
  };
}

export function parsePlaceholdersFilter(
  templatePipelineDocument: PipelineDocument
): PipelineDocument {
  return {
    ...templatePipelineDocument,
    segments: templatePipelineDocument.segments.map(parsePlaceholders).flat(1),
  };
}
