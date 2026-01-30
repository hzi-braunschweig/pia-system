/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Component,
  Input,
  Renderer2,
  ElementRef,
  AfterViewInit,
  ViewChild,
} from '@angular/core';
import {
  QuestionnaireInstance,
  QuestionnaireStatus,
} from '../questionnaire.model';
import { compareQuestionnaireInstances } from './compare-questionnaire-instances';
import {
  CdkVirtualScrollViewport,
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
} from '@angular/cdk/scrolling';
import { addIcons } from 'ionicons';
import {
  megaphone,
  create,
  checkmark,
  checkmarkDone,
  alertCircle,
  eye,
} from 'ionicons/icons';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import {
  IonList,
  IonItemGroup,
  IonItem,
  IonIcon,
  IonLabel,
  IonItemDivider,
  IonBadge,
  IonNote,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { QuestionnaireProgressBarComponent } from '../questionnaire-progress-bar/questionnaire-progress-bar.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-questionnaire-instances-list',
  templateUrl: './questionnaire-instances-list.component.html',
  styleUrls: ['./questionnaire-instances-list.component.scss'],
  imports: [
    NgIf,
    IonList,
    IonItemGroup,
    NgFor,
    IonItem,
    RouterLink,
    IonIcon,
    IonLabel,
    QuestionnaireProgressBarComponent,
    IonItemDivider,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    IonBadge,
    IonNote,
    DatePipe,
    TranslateModule,
  ],
})
export class QuestionnaireInstancesListComponent implements AfterViewInit {
  private static readonly order = new Map<QuestionnaireStatus, number>([
    ['in_progress', 1],
    ['active', 2],
    ['released', 3],
    ['released_once', 3],
    ['released_twice', 3],
  ]);
  spontanQuestionnaireInstances: QuestionnaireInstance[] = [];
  otherQuestionnaireInstances: QuestionnaireInstance[] = [];

  @ViewChild('scrollViewport') scrollViewport: CdkVirtualScrollViewport;
  @ViewChild('listTopQuestionnaireInstances')
  listTopQuestionnaireInstances: ElementRef;

  @Input() set questionnaireInstances(
    questionnaireInstances: QuestionnaireInstance[]
  ) {
    if (!questionnaireInstances) {
      return;
    }
    const instancesResult = questionnaireInstances.toSorted(
      compareQuestionnaireInstances
    );
    this.spontanQuestionnaireInstances = instancesResult.filter(
      this.isForSpontanList
    );
    this.otherQuestionnaireInstances = instancesResult.filter(
      (instance) => !this.isForSpontanList(instance)
    );
  }

  constructor(private readonly renderer: Renderer2) {
    addIcons({ megaphone, create, checkmark, checkmarkDone, alertCircle, eye });
  }

  ngAfterViewInit(): void {
    let countQuestionnaires =
      this.spontanQuestionnaireInstances.length +
      this.otherQuestionnaireInstances.length;

    if (countQuestionnaires > 0) {
      setTimeout(
        () => {
          // We get the bounding box to know, how much space the scrollable list can have
          const listBox =
            this.listTopQuestionnaireInstances.nativeElement.getBoundingClientRect();

          const bufferHeight = 15; // A small buffer to make sure, the parent container never overflows
          const scrollListHeight =
            document.defaultView.visualViewport.height -
            listBox.bottom -
            bufferHeight;

          this.renderer.setStyle(
            this.scrollViewport.elementRef.nativeElement,
            'height',
            `${scrollListHeight}px`
          );

          // after we set the height, we update the cdk virtual scroll viewport to take the new height into account
          this.scrollViewport.checkViewportSize();
        },
        100 // the final height of listBox is only available after a short delay
      );
    }
  }

  isEmpty() {
    return (
      !this.spontanQuestionnaireInstances.length &&
      !this.otherQuestionnaireInstances.length
    );
  }

  private isForSpontanList(instance): boolean {
    return (
      instance.questionnaire.cycle_unit === 'spontan' &&
      (instance.status === 'active' || instance.status === 'in_progress')
    );
  }
}
