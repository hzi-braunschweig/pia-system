/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SnakeNamingStrategyWithPlural } from './snakeNamingStrategyWithPlural';
import { expect } from 'chai';

describe('SnakeNamingStrategyWithPlural', () => {
  it('should handle camelCase', () => {
    const strategy = new SnakeNamingStrategyWithPlural();
    const newName = strategy.tableName('CamelCase', '');
    expect(newName).to.equal('camel_cases');
  });
  it('should add -es if it already ends with s', () => {
    const strategy = new SnakeNamingStrategyWithPlural();
    const newName = strategy.tableName('Process', '');
    expect(newName).to.equal('processes');
  });
  it('should replace y with ies', () => {
    const strategy = new SnakeNamingStrategyWithPlural();
    const newName = strategy.tableName('TestEntity', '');
    expect(newName).to.equal('test_entities');
  });
});
