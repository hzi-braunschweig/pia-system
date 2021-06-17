/* Hallo Programmer
 * This Class should provide to improve "question-proband"
 * All needed methods and functions will be saved here and
 * tested in tools.spec.ts
 * This is a provisional file. It should help to refactor
 * "question-proband"
 *
 * Please write only pure functions
 */

export class Tools {
  getAnswerVersion(
    questionnaire_instance_status: string,
    answerVersionFromServer: number,
    release_version: number
  ): number | undefined {
    let version: number | undefined;
    switch (questionnaire_instance_status) {
      case 'active':
      case 'in_progress':
        version = answerVersionFromServer !== 0 ? answerVersionFromServer : 1;
        break;
      case 'released_once':
      case 'released':
        if (release_version === answerVersionFromServer) {
          version = answerVersionFromServer + 1;
        } else {
          version = answerVersionFromServer !== 0 ? answerVersionFromServer : 1;
        }
        break;
      default:
        break;
    }
    return version;
  }
}
