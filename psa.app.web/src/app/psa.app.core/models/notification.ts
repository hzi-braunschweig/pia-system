export type NotificationDto =
  | QuestionnaireNotificationDto
  | SampleNotificationDto
  | CustomNotificationDto;

export interface BaseNotificationDto {
  reference_id: string;
  title: string;
  body: string;
}

export interface QuestionnaireNotificationDto extends BaseNotificationDto {
  notification_type: 'qReminder';
  questionnaire_id: string;
  questionnaire_version: string;
}

export interface SampleNotificationDto extends BaseNotificationDto {
  notification_type: 'sample';
}

export interface CustomNotificationDto extends BaseNotificationDto {
  notification_type: 'custom';
}

export interface NotificationCreationRequest {
  title: string;
  body: string;
  recipients: string[];
  date?: string;
}

export interface NotificationCreationResponse {
  success: boolean;
}

export interface EmailRequest {
  recipients: string[];
  title: string;
  body: string;
}
