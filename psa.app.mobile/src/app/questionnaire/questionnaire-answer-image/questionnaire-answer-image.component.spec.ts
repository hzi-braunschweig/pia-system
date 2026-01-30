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
import { IonModal } from '@ionic/angular/standalone';
import { QuestionnaireAnswerImageComponent } from './questionnaire-answer-image.component';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { Camera } from '@capacitor/camera';
import SpyObj = jasmine.SpyObj;

describe('QuestionnaireAnswerImageComponent', () => {
  let component: QuestionnaireAnswerImageComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerImageComponent>;

  let modal: SpyObj<IonModal>;

  beforeEach(() => {
    spyOn(Camera, 'getPhoto').and.resolveTo({
      base64String: 'mock_base64_string',
      format: 'jpeg',
      saved: false,
    });
    modal = jasmine.createSpyObj('Modal', ['dismiss']);

    TestBed.configureTestingModule({
      imports: [QuestionnaireAnswerImageComponent, TranslateModule.forRoot()],
      providers: [],
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

  it('should dismiss modal', fakeAsync(() => {
    component.cancel();
    expect(modal.dismiss).toHaveBeenCalledWith(null, 'cancel');
  }));

  it('should delete an uploaded picture', fakeAsync(() => {
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
