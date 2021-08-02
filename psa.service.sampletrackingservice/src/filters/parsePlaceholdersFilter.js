/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { parse } = require('himalaya');
const TemplateSegmentTypes = require('./templateSegmentTypes');
const TemplateParseError = require('./errors/templateParseError');

const parsePlaceholdersFilter = (function () {
  const consumesType = TemplateSegmentTypes.HTML_TEMPLATE;
  const producesType = TemplateSegmentTypes.PLACEHOLDER;

  /**
   * Finds placeholder within HTML templates and converts them
   * to placeholder segments which can be converted by other filters
   *
   * @param segment Segment in which placeholders should be parsed
   * @returns {*}
   */
  function parsePlaceholders(segment) {
    if (segment.type !== consumesType) {
      return segment;
    }
    const splittedSegments = [];
    const placeholderSplitter = /<(pia-[a-z-]+)[\s\S]*?>[\s\S]*?<\/\1>/gm;

    let start = 0;
    let match = placeholderSplitter.exec(segment.content);
    while (match) {
      splittedSegments.push({
        type: consumesType,
        content: segment.content.substring(start, match.index),
      });
      splittedSegments.push({
        type: producesType,
        element: parsePlaceholder(match[0]),
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
  function parsePlaceholder(placeholderText) {
    const parsed = parse(placeholderText);
    if (!parsed || parsed.length === 0) {
      throw TemplateParseError('Could not parse placeholder string');
    }
    return convertPlaceholderElement(parsed[0]);
  }

  /**
   * Converts a parsed placeholder element to a specific
   * placeholder element description
   *
   * @param element Parsed element
   * @returns {{children: *[], name: *, attributes: *}}
   */
  function convertPlaceholderElement(element) {
    return {
      name: element.tagName,
      attributes: element.attributes.map((attr) => ({
        key: attr.key,
        value: attr.value,
      })),
      children: (element.children || [])
        .filter((child) => child.type === 'element')
        .map((child) => convertPlaceholderElement(child)),
    };
  }

  return function (templatePipelineDocument) {
    return {
      ...templatePipelineDocument,
      segments: templatePipelineDocument.segments
        .map(parsePlaceholders)
        .flat(1),
    };
  };
})();

module.exports = parsePlaceholdersFilter;
