import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { MarkdownComponent } from 'ngx-markdown';
import { MockComponent, MockPipe } from 'ng-mocks';
import SpyObj = jasmine.SpyObj;

import { HomePage } from './home.page';
import { HeaderComponent } from '../shared/components/header/header.component';
import { PrimaryStudyService } from '../shared/services/primary-study/primary-study.service';
import { QuestionnaireClientService } from '../questionnaire/questionnaire-client.service';
import { Study } from '../questionnaire/questionnaire.model';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  let primaryStudy: SpyObj<PrimaryStudyService>;
  let questionnaireClient: SpyObj<QuestionnaireClientService>;

  beforeEach(() => {
    primaryStudy = jasmine.createSpyObj('PrimaryStudyService', [
      'getPrimaryStudy',
    ]);
    questionnaireClient = jasmine.createSpyObj('QuestionnaireClientService', [
      'getStudyWelcomeText',
    ]);

    primaryStudy.getPrimaryStudy.and.resolveTo({ name: 'Teststudy' } as Study);
    questionnaireClient.getStudyWelcomeText.and.resolveTo({
      study_id: 'Teststudy',
      welcome_text: 'Welcome!',
      language: 'en-US',
    });

    TestBed.configureTestingModule({
      declarations: [
        HomePage,
        MockComponent(MarkdownComponent),
        MockPipe(TranslatePipe, (value) => value),
        MockComponent(HeaderComponent),
      ],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: PrimaryStudyService, useValue: primaryStudy },
        { provide: QuestionnaireClientService, useValue: questionnaireClient },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
  });

  it('should contain a welcome text', fakeAsync(() => {
    component.ngOnInit();
    tick();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[unit-welcome-text]').textContent
    ).toEqual('Welcome!');
  }));
});
