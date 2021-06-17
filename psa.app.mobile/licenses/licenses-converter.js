const knownMissingLicenseTexts = require('./known-missing-license-texts');
const licenseCheckerFormatJson = require('./license-checker-format.json');
const packageJson = require('../package.json');

/**
 * Converts the license-checker output to the desired output for the webapp
 *
 * @description
 * This is a workaround, as the option to provide license-checker with a custom output
 * format via --customPath does not work as expected. It does only append new properties like 'licenseText'
 * to the output, but does not remove the default properties.
 *
 * The LicensesConverter will read the standard input and expects a license-checker JSON string as input.
 * The JSON consists of properties we do not want to have in the final JSON which is send to the users,
 * e.g. the local path of a package. Thus, only three properties are written to the output JSON file:
 * - packageName
 * - license
 * - licenseText
 *
 * The license text is also checked to actually contain a license by some string comparison
 * {@see #containsLicenseText}. If no license was found, the existance of a replacement text within
 * known-missing-license-texts.js is checked. If it exists, the license text will be replaced. If it
 * does not exist, an error will be thrown in order to signal, that a problem exists. The issue then
 * needs to be handled manually.
 *
 * The output JSON file ist written to a path which needs to be specified by the parameter --out
 *
 * @example
 * license-checker --production --json | node convert-licenses.js --out src/assets/licenses.json
 *
 * @typedef {{ packageName: string, license: string, licenseText: string }} LicenseEntry
 */
class LicensesConverter {
  static EMPTY_LICENSE_TEXT_PLACEHOLDER = licenseCheckerFormatJson.licenseText;

  static OWN_PACKAGE_NAME = packageJson.name;

  static VALID_LICENSE_TEXT_SNIPPETS = [
    // Apache
    'TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION',
    'Licensed under the Apache License, Version 2.0 (the "License")',
    // MIT
    'The MIT License (MIT)',
    'Permission is hereby granted, free of charge',
    // ISC
    'Permission to use, copy, modify, and/or distribute',
    // BSD
    'Redistribution and use in source and binary forms, with or',
    // Unlicense
    'Anyone is free to copy, modify, publish, use, compile, sell, or',
    // WTFPL
    'DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE',
  ];

  /**
   * Returns licenses without undesired properties
   *
   * @param {Object.<string, { name: string, licenses: string, licenseText: string }>} licenseCheckerJson
   * @returns {LicenseEntry[]}
   */
  static removeUndesiredProperties(licenseCheckerJson) {
    return Object.values(licenseCheckerJson).map((entry) => ({
      packageName: entry.name,
      license: entry.licenses,
      licenseText: entry.licenseText,
    }));
  }

  /**
   * Removes the root package, which is a PIA package, from the list
   *
   * @param {LicenseEntry[]} licenseArray
   * @returns {LicenseEntry[]}
   */
  static filterOwnPackage(licenseArray) {
    return licenseArray.filter(
      (entry) => entry.packageName !== LicensesConverter.OWN_PACKAGE_NAME
    );
  }

  /**
   * Replaces licenseTexts which do not really contain a license text.
   *
   * Missing license texts need to be manually added to known-missing-license-texts.js.
   * If a missing license text is found, which does not have an entry in this file,
   * the script will throw an error. In this case the license text first has to be
   * added to the known missing license texts.
   *
   * @param {LicenseEntry[]} licenseArray
   * @returns {LicenseEntry[]}
   */
  static addKnownMissingLicenseTexts(licenseArray) {
    return licenseArray.map((entry) => ({
      ...entry,
      licenseText: LicensesConverter.#getKnownMissingLicenseText(entry),
    }));
  }

  /**
   * @param {LicenseEntry[]} licenseArray
   * @returns {{ licenses: LicenseEntry[] }}
   */
  static wrapArrayInObject(licenseArray) {
    return { licenses: licenseArray };
  }

  /**
   * @param {string} text
   * @returns {boolean}
   */
  static #containsLicenseText(text) {
    return (
      typeof text === 'string' &&
      text !== LicensesConverter.EMPTY_LICENSE_TEXT_PLACEHOLDER &&
      LicensesConverter.VALID_LICENSE_TEXT_SNIPPETS.some((snippet) =>
        text.includes(snippet)
      )
    );
  }

  /**
   * @param {LicenseEntry} entry
   * @returns {string}
   */
  static #getKnownMissingLicenseText(entry) {
    let licenseText;
    if (knownMissingLicenseTexts.has(entry.packageName)) {
      licenseText = knownMissingLicenseTexts.get(entry.packageName);
    } else {
      licenseText = entry.licenseText;
    }
    if (!LicensesConverter.#containsLicenseText(licenseText)) {
      throw new Error(
        'Could not find a valid license text for package "' +
          entry.packageName +
          '" with text:\n\n' +
          entry.licenseText +
          '\n\n' +
          'Please add a valid license text to known-missing-license-texts.js\n\n'
      );
    }
    return licenseText;
  }
}

module.exports = LicensesConverter;
