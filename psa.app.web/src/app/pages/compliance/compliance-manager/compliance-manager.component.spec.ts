import { ComplianceManagerComponent } from './compliance-manager.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogViewComplianceComponent } from '../compliance-view-dialog/dialog-view-compliance.component';
import { AlertService } from '../../../_services/alert.service';
import { QuestionnaireService } from '../../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import { HttpClientModule } from '@angular/common/http';
import { AuthenticationManager } from '../../../_services/authentication-manager.service';
import { MockModule } from 'ng-mocks';

@Pipe({ name: 'translate' })
class MockTranslatePipe implements PipeTransform {
  transform(value): any {
    return value;
  }
}

describe('ComplianceManagerComponent', () => {
  let component: ComplianceManagerComponent;
  let fixture: ComponentFixture<ComplianceManagerComponent>;

  let dialog: MatDialog;
  let alertService: AlertService;
  let questionnaireService: QuestionnaireService;
  const authManager = { currentRole: 'EinwilligungsManager' };

  beforeEach(() => {
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    alertService = jasmine.createSpyObj('AlertService', ['errorObject']);
    questionnaireService = jasmine.createSpyObj('QuestionnaireService', [
      'getStudies',
    ]);

    TestBed.configureTestingModule({
      declarations: [ComplianceManagerComponent, MockTranslatePipe],
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: AlertService, useValue: alertService },
        { provide: QuestionnaireService, useValue: questionnaireService },
        { provide: AuthenticationManager, useValue: authManager },
      ],
      imports: [MockModule(HttpClientModule)],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ComplianceManagerComponent);
    component = fixture.componentInstance;
    fixture.componentInstance.activeFilter.studyName = 'test-study';
  });

  describe('showComplianceDetails()', () => {
    it('open compliance details dialog', () => {
      component.showComplianceDetails('1234');
      expect(dialog.open).toHaveBeenCalledWith(
        DialogViewComplianceComponent,
        jasmine.objectContaining({
          data: { study: 'test-study', complianceId: '1234' },
        })
      );
    });
  });
});
