import { ServiceClient } from '../core/serviceClient';
import { PersonalDataInternalDto } from '../dtos/personalData';
export declare class PersonaldataserviceClient extends ServiceClient {
    updatePersonalData(pseudonym: string, personalData: PersonalDataInternalDto, skipUpdateAccount?: boolean): Promise<void>;
    getPersonalDataEmail(pseudonym: string): Promise<string | null>;
    deletePersonalDataOfUser(pseudonym: string): Promise<void>;
}
