export interface Log {
  id: string;
  timestamp: string;
  toDate: string;
  fromDate: string;
  activity: {
    type: string;
    questionnaireID: string;
    questionnaireName: string;
    questionnaireInstanceId: string;
  };
}
