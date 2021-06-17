import { Component, Input } from '@angular/core';
import { QuestionnaireStatus } from '../questionnaire.model';

@Component({
  selector: 'app-questionnaire-progress-bar',
  templateUrl: './questionnaire-progress-bar.component.html',
})
export class QuestionnaireProgressBarComponent {
  @Input()
  progress: number;

  @Input()
  status: QuestionnaireStatus;
}
