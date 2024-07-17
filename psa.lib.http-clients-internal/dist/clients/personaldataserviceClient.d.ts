import { ServiceClient } from '../core/serviceClient';
import { PendingPersonalDataDeletion } from '../dtos/pendingDeletion';
import { PersonalDataInternalDto, PersonalDataInternalDtoGet } from '../dtos/personalData';
export declare class PersonaldataserviceClient extends ServiceClient {
    updatePersonalData(pseudonym: string, personalData: PersonalDataInternalDto, skipUpdateAccount?: boolean): Promise<void>;
    getPersonalDataEmail(pseudonym: string): Promise<string | null>;
    getPersonalData(studyName: string): Promise<PersonalDataInternalDtoGet[]>;
    getPendingPersonalDataDeletions(studyName: string): Promise<PendingPersonalDataDeletion[]>;
    deletePersonalDataOfUser(pseudonym: string): Promise<void>;
}
