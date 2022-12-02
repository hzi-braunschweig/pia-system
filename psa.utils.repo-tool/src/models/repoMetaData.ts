/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface RepoMetaData {
  /**
   * A List of all second level folders that contain a Dockerfile
   */
  docker: string[];
  /**
   * A List of all second level folders that contain a package.json with at least one of the scripts
   * 'lint', 'test.unit' or 'test.int' which all need a `npm install`
   */
  npm: string[];
  /**
   * A List of all second level folders that contain a package.json with a 'lint' script
   */
  lint: string[];
  /**
   * A List of all second level folders that contain a package.json with a 'test.unit' script
   */
  testUnit: string[];
  /**
   * A List of all second level folders that contain a package.json with a 'test.int' script
   */
  testInt: string[];
  /**
   * A List of all second level folders that contain a package.json with a 'e2e.ci' script
   */
  testE2e: string[];
  /**
   * A List of all second level folders that contain a package.json and a Dockerfile with
   * npm-install stage
   */
  npmInstall: string[];
}
