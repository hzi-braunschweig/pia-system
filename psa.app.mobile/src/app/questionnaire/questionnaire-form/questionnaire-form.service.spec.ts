import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import SpyObj = jasmine.SpyObj;

import { QuestionnaireFormService } from './questionnaire-form.service';
import { QuestionnaireClientService } from '../questionnaire-client.service';

describe('QuestionnaireFormService', () => {
  let service: QuestionnaireFormService;

  let questionnaireClient: SpyObj<QuestionnaireClientService>;

  beforeEach(() => {
    questionnaireClient = jasmine.createSpyObj('QuestionnaireClientService', [
      'getFileById',
    ]);

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        { provide: QuestionnaireClientService, useValue: questionnaireClient },
      ],
    });
    service = TestBed.inject(QuestionnaireFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
