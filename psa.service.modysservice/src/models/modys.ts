import { VPersonContactDetailOverview, VPersonOverview } from './modysApi';

/**
 * modysservice specific person summary
 */
export interface PersonSummary {
  pseudonym: string;
  overview: VPersonOverview;
  contactDetails: VPersonContactDetailOverview[];
}

export interface ModysConnectionConfig {
  baseUrl: string;
  username: string;
  password: string;
}

export interface ModysConfig extends ModysConnectionConfig {
  study: string;
  identifierTypeId: number;
}
