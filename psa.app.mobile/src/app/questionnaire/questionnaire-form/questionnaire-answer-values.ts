import { Answer } from '../questionnaire.model';

export class QuestionnaireAnswerValues {
  private answerValues: Map<number, Answer> = this.createAnswerValuesMap();

  constructor(private answers: Answer[]) {}

  get(answerOptionId: number): string {
    const answer = this.answerValues.get(answerOptionId);
    return answer ? answer.value : null;
  }

  private createAnswerValuesMap(): Map<number, Answer> {
    return new Map(
      this.answers.map((answer) => [answer.answer_option_id, answer])
    );
  }
}
