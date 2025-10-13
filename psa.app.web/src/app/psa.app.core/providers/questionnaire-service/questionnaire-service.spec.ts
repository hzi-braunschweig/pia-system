/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionnaireService } from './questionnaire-service';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('QuestionnaireService', () => {
  let service: QuestionnaireService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        QuestionnaireService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(QuestionnaireService);
    TestBed.inject(HttpTestingController);
  });

  describe('export', () => {
    let createdForm: HTMLFormElement;
    let appendedElements: HTMLElement[] = [];

    beforeEach(() => {
      createdForm = document.createElement('form');

      const originalCreateElement = document.createElement.bind(document);
      spyOn(document, 'createElement').and.callFake((tagName: string) => {
        if (tagName === 'form') {
          return createdForm;
        }
        return originalCreateElement(tagName);
      });
      spyOn(document.body, 'appendChild').and.callFake((element: any) => {
        appendedElements.push(element);
        return element;
      });
      spyOn(document.body, 'removeChild');
      spyOn(createdForm, 'submit');
    });

    afterEach(() => {
      appendedElements = [];
    });

    it('should handle export request with correct data', () => {
      const exportData = {
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        field1: 'value1',
        field2: 'value2',
      };
      const token = 'test-token';

      service.export(exportData, token);

      expect(createdForm.action).toMatch(/api\/v1\/questionnaire\/export$/);
      expect(createdForm.method).toBe('post');
      expect(createdForm.style.display).toBe('none');

      const appendedForm = appendedElements[0] as HTMLFormElement;
      const inputs = Array.from(appendedForm.getElementsByTagName('input'));

      const tokenInput = inputs.find((input) => input.name === 'token');
      expect(tokenInput?.value).toBe(token);

      const optionsInput = inputs.find(
        (input) => input.name === 'exportOptions'
      );
      expect(optionsInput?.value).toBe(
        JSON.stringify({
          ...exportData,
          start_date: new Date('2024-01-01').toDateString(),
          end_date: new Date('2024-12-31').toDateString(),
        })
      );

      expect(createdForm.submit).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalledWith(createdForm);
    });
  });
});
