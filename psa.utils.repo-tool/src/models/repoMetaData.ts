/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface RepoMetaData {
  /**
   * A List of all docker builds
   */
  docker: {
    /**
     * The name of the second level folder
     */
    name: string;
    /**
     * Path to the dockerfile for the build
     */
    dockerfile: string;
    /**
     * Specifies if that folder contains a package.json and a Dockerfile with a npm-install stage
     */
    npmInstall: boolean;
    /**
     * Speciefies if the image should contained in deployment or if it is only for development
     */
    deploy: boolean;
  }[];
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
   * A List of all second level folders that contain a package.json with a 'build.openapi' script
   */
  openApi: string[];
}
