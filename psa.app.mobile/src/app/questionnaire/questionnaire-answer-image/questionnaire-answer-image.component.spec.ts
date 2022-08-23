/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { IonicModule, IonModal } from '@ionic/angular';
import { Camera } from '@awesome-cordova-plugins/camera/ngx';
import { Chooser, ChooserResult } from '@awesome-cordova-plugins/chooser/ngx';
import SpyObj = jasmine.SpyObj;

import { QuestionnaireAnswerImageComponent } from './questionnaire-answer-image.component';
import { By } from '@angular/platform-browser';
import { MockPipe } from 'ng-mocks';
import { TranslatePipe } from '@ngx-translate/core';

describe('QuestionnaireAnswerImageComponent', () => {
  let component: QuestionnaireAnswerImageComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerImageComponent>;

  let camera: SpyObj<Camera>;
  let chooser: SpyObj<Chooser>;
  let modal: SpyObj<IonModal>;

  beforeEach(() => {
    camera = jasmine.createSpyObj('Camera', ['getPicture']);
    camera.DestinationType = { DATA_URL: 0, FILE_URI: 1, NATIVE_URI: 2 };
    camera.getPicture.and.resolveTo('ein-tolles-base64-kodiertes-bild');
    chooser = jasmine.createSpyObj('Chooser', ['getFile']);
    const result: ChooserResult = {
      dataURI: 'string',
      mediaType: 'string',
      name: 'ein-ganz-toller-test-name.jpg',
      uri: 'string',
    };
    chooser.getFile.and.resolveTo(result);
    modal = jasmine.createSpyObj('Modal', ['dismiss']);

    TestBed.configureTestingModule({
      declarations: [
        QuestionnaireAnswerImageComponent,
        MockPipe(TranslatePipe, (value) => value),
      ],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: Camera, useValue: camera },
        { provide: Chooser, useValue: chooser },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireAnswerImageComponent);
    component = fixture.componentInstance;
    component.label = 'Warum ist die Banana krumm?';

    fixture.detectChanges();
    component.modal = modal;
  });

  it('should not have a thumbnail when questionnaire starts', () => {
    const imageName = fixture.debugElement.query(
      By.css('[data-unit="image-name"]')
    );
    expect(imageName.nativeElement.innerText.trim()).toEqual(
      'QUESTIONNAIRE_QUESTIONS.NO_IMAGE_UPLOAD'
    );
    const thumbnail = fixture.debugElement.query(
      By.css('[data-unit="thumbnail"]')
    );
    expect(thumbnail).toBeNull();
  });

  it('should show thumbnail of camera picture', fakeAsync(() => {
    jasmine.clock().install().mockDate(new Date('2022-09-18T19:30:00'));

    const buttonCamera = fixture.debugElement.query(
      By.css('[data-unit="on-open-camera"]')
    );
    expect(buttonCamera).not.toBeNull();
    buttonCamera.nativeElement.click();
    tick();

    fixture.detectChanges();
    const imageName = fixture.debugElement.query(
      By.css('[data-unit="image-name"]')
    );
    expect(imageName.nativeElement.innerText.trim()).toEqual(
      'photo_202209181930.jpg'
    );
    const image = fixture.debugElement.query(By.css('[data-unit="image"]'));
    expect(image).not.toBeNull();

    jasmine.clock().uninstall();
  }));

  it('should show thumbnail of an uploaded picture', fakeAsync(() => {
    const buttonChooser = fixture.debugElement.query(
      By.css('[data-unit="on-open-chooser"]')
    );
    expect(buttonChooser).not.toBeNull();
    buttonChooser.nativeElement.click();
    tick();

    fixture.detectChanges();
    const imageName = fixture.debugElement.query(
      By.css('[data-unit="image-name"]')
    );
    expect(imageName.nativeElement.innerText.trim()).toEqual(
      'ein-ganz-toller-test-name.jpg'
    );
    const image = fixture.debugElement.query(By.css('[data-unit="image"]'));
    expect(image).not.toBeNull();
  }));

  it('should dismiss modal', fakeAsync(() => {
    component.cancel();
    expect(modal.dismiss).toHaveBeenCalledWith(null, 'cancel');
  }));

  it('should delete an uploaded picture', fakeAsync(() => {
    const buttonChooser = fixture.debugElement.query(
      By.css('[data-unit="on-open-chooser"]')
    );
    expect(buttonChooser).not.toBeNull();
    buttonChooser.nativeElement.click();
    tick();

    fixture.detectChanges();
    const imageName = fixture.debugElement.query(
      By.css('[data-unit="image-name"]')
    );
    expect(imageName.nativeElement.innerText.trim()).toEqual(
      'ein-ganz-toller-test-name.jpg'
    );
    const image = fixture.debugElement.query(By.css('[data-unit="image"]'));
    expect(image).not.toBeNull();

    const buttonDelete = fixture.debugElement.query(
      By.css('[data-unit="delete-picture"]')
    );
    buttonDelete.nativeElement.click();
    tick();

    fixture.detectChanges();
    expect(imageName.nativeElement.innerText.trim()).toEqual(
      'QUESTIONNAIRE_QUESTIONS.NO_IMAGE_UPLOAD'
    );
  }));
});
