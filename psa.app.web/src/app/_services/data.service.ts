import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class DataService {
  private statusSource = new BehaviorSubject<string>('');
  currentStatus = this.statusSource.asObservable();

  private currentProbandsList = new BehaviorSubject<any>([]);
  probandsForLetters = this.currentProbandsList.asObservable();

  private currentPlannedProbandsList = new BehaviorSubject<any>([]);
  plannedProbandsForLetters = this.currentPlannedProbandsList.asObservable();

  constructor() {}

  changeQuestionnaireInstanceStatus(
    changeQuestionnaireInstanceStatus: string
  ): void {
    this.statusSource.next(changeQuestionnaireInstanceStatus);
  }

  setProbandsForCreateLetters(changeProbandsForLetters: any): void {
    this.currentProbandsList.next(changeProbandsForLetters);
  }

  setPlannedProbandsForLetters(changePlannedProbandsForLetters: any): void {
    this.currentPlannedProbandsList.next(changePlannedProbandsForLetters);
  }
}
