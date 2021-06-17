import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Camera } from '@ionic-native/camera/ngx';
import { Chooser } from '@ionic-native/chooser/ngx';
import SpyObj = jasmine.SpyObj;

import { QuestionnaireAnswerImageComponent } from './questionnaire-answer-image.component';

describe('QuestionnaireAnswerImageComponent', () => {
  let component: QuestionnaireAnswerImageComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerImageComponent>;

  let camera: SpyObj<Camera>;
  let chooser: SpyObj<Chooser>;

  beforeEach(() => {
    camera = jasmine.createSpyObj('Camera', ['getPicture']);
    camera.DestinationType = { DATA_URL: 0, FILE_URI: 1, NATIVE_URI: 2 };
    chooser = jasmine.createSpyObj('Chooser', ['getFile']);

    TestBed.configureTestingModule({
      declarations: [QuestionnaireAnswerImageComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: Camera, useValue: camera },
        { provide: Chooser, useValue: chooser },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireAnswerImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
