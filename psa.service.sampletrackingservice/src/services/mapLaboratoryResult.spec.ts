/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */

const expect = require('chai').expect;
import format from 'date-fns/format';
import { mapLaboratoryResult } from './mapLaboratoryResult';

describe('Map Laboratory Result', () => {
  it('should translate a lab result to an entity', () => {
    const document = getEntity();

    const dateFormat = 'dd.MM.yyyy, H:mm';
    function formatDate(isoDate: any) {
      return format(new Date(isoDate), dateFormat);
    }

    const result = mapLaboratoryResult(document);

    expect(result).to.deep.equal({
      id: 'Test',
      user_id: 'testproband1',
      order_id: 1062743,
      date_of_sampling: null,
      dummy_sample_id: null,
      new_samples_sent: false,
      performing_doctor: null,
      remark: null,
      status: 'Unterwegs zum Labor',
      study_status: 'active',
      lab_observations: {
        '1be036f0a7ad3649f4300f7bba6da1af': {
          name: 'Influenzavirus-A-NAT',
          result: 'positiv',
          date_of_analysis: formatDate('2018-05-03T00:00:00.000Z'),
          date_of_announcement: formatDate('2018-09-06T00:00:00.000Z'),
          date_of_delivery: formatDate('2018-05-31T18:22:00.000Z'),
        },
        a38e1936e812bdfd2911b4bf548c2f83: {
          name: 'HMPV-NAT',
          result: 'positiv',
          date_of_analysis: formatDate('2018-05-03T00:00:00.000Z'),
          date_of_announcement: formatDate('2018-09-06T00:00:00.000Z'),
          date_of_delivery: formatDate('2018-05-31T18:22:00.000Z'),
        },
        e92528add3c588e396dbb981aca8352e: {
          name: 'Influenzavirus-B-NAT',
          result: 'negativ',
          date_of_analysis: formatDate('2018-05-03T00:00:00.000Z'),
          date_of_announcement: formatDate('2018-09-06T00:00:00.000Z'),
          date_of_delivery: formatDate('2018-05-31T18:22:00.000Z'),
        },
        f678e3e6505f2d5b38b8d912586281bb: {
          name: 'Adenovirus-PCR (resp.)',
          result: 'negativ',
          date_of_analysis: formatDate('2018-05-03T00:00:00.000Z'),
          date_of_announcement: formatDate('2018-09-06T00:00:00.000Z'),
          date_of_delivery: formatDate('2018-05-31T18:22:00.000Z'),
        },
      },
    });
  });

  function getEntity() {
    return {
      id: 'Test',
      user_id: 'testproband1',
      order_id: 1062743,
      date_of_sampling: null,
      dummy_sample_id: null,
      new_samples_sent: false,
      performing_doctor: null,
      remark: null,
      status: 'sampled',
      study_status: 'active',
      lab_observations: [
        {
          id: 1,
          lab_result_id: 'Test-1234567',
          name_id: 521035,
          name: 'Adenovirus-PCR (resp.)',
          result_string: 'negativ',
          result_value: null,
          comment: 'some comment',
          date_of_analysis: '2018-05-03T00:00:00.000Z',
          date_of_announcement: '2018-09-06T00:00:00.000Z',
          date_of_delivery: '2018-05-31T18:22:00.000Z',
        },
        {
          id: 2,
          lab_result_id: 'Test-1234567',
          name_id: 521036,
          name: 'HMPV-NAT',
          result_string: 'positiv',
          result_value: 33,
          comment: 'some comment',
          date_of_analysis: '2018-05-03T00:00:00.000Z',
          date_of_announcement: '2018-09-06T00:00:00.000Z',
          date_of_delivery: '2018-05-31T18:22:00.000Z',
        },
        {
          id: 3,
          lab_result_id: 'Test-1234567',
          name_id: 521037,
          name: 'Influenzavirus-A-NAT',
          result_string: 'positiv',
          result_value: 21,
          comment: 'some comment',
          date_of_analysis: '2018-05-03T00:00:00.000Z',
          date_of_announcement: '2018-09-06T00:00:00.000Z',
          date_of_delivery: '2018-05-31T18:22:00.000Z',
        },
        {
          id: 4,
          lab_result_id: 'Test-1234567',
          name_id: 521038,
          name: 'Influenzavirus-B-NAT',
          result_string: 'negativ',
          result_value: null,
          comment: 'some comment',
          date_of_analysis: '2018-05-03T00:00:00.000Z',
          date_of_announcement: '2018-09-06T00:00:00.000Z',
          date_of_delivery: '2018-05-31T18:22:00.000Z',
        },
      ],
    };
  }
});
