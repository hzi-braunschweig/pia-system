import { Pipe, PipeTransform } from '@angular/core';
import { StudyAccess } from '../psa.app.core/models/user-with-study-access';
import { TranslateService } from '@ngx-translate/core';

/**
 * Returns StudyAccess as readable string
 */
@Pipe({ name: 'studyAccess' })
export class StudyAccessPipe implements PipeTransform {
  accessLevelMapping = {
    read: 'DIALOG.READ',
    write: 'DIALOG.WRITE',
    admin: 'DIALOG.ADMIN',
  };

  constructor(private readonly translate: TranslateService) {}

  transform(studyAccesses: StudyAccess[]): string {
    return studyAccesses
      .map((studyAccess) => this.toTranslatedString(studyAccess))
      .join(', ');
  }

  private toTranslatedString(studyAccess: StudyAccess): string {
    const accessLevelTranslation = this.translate.instant(
      this.accessLevelMapping[studyAccess.access_level]
    );
    return `${studyAccess.study_id} (${accessLevelTranslation})`;
  }
}
