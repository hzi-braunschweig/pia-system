/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Testing } from 'cdk8s';
import { MainChart } from './main';

expect.extend({
  toHavePiaLabel(obj?: {
    kind?: string;
    metadata?: {
      name?: string;
      labels?: Record<string, string>;
    };
  }) {
    return {
      pass: obj?.metadata?.labels?.app === 'pia',
      message(): string {
        return `all k8s objects must have app=pia label set ${
          obj?.metadata?.name ?? ''
        } [${obj?.kind ?? ''}]`;
      },
    };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toHavePiaLabel(): void;
    }
  }
}

describe('Main', () => {
  const app = Testing.app();
  const main = new MainChart(app);

  describe('labels', () => {
    main.allCharts.forEach((chart) => {
      test(chart.node.id, () => {
        const objs = Testing.synth(chart);

        for (const obj of objs) {
          expect(obj).toHavePiaLabel();
        }
      });
    });
  });
});
