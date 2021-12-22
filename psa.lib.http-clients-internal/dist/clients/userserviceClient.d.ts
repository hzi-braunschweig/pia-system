import { ServiceClient } from '../core/serviceClient';
import { ProbandInternalDto, ProbandRequestInternalDto, ProbandResponseInternalDto, ProbandStatus } from '../dtos/proband';
import { StudyInternalDto } from '../dtos/study';
import { ExternalComplianceInternalDto } from '../dtos/externalCompliance';
export interface PseudonymsFilter {
    study?: string;
    complianceContact?: boolean;
    probandStatus?: ProbandStatus | ProbandStatus[];
}
export declare class UserserviceClient extends ServiceClient {
    getPseudonyms(filter?: PseudonymsFilter): Promise<string[]>;
    lookupIds(pseudonym: string): Promise<string | null>;
    lookupMappingId(pseudonym: string): Promise<string>;
    retrieveUserExternalCompliance(pseudonym: string): Promise<ExternalComplianceInternalDto>;
    getProbandsWithAccessToFromProfessional(username: string): Promise<string[]>;
    getProband(pseudonym: string): Promise<ProbandInternalDto | null>;
    isProbandExistentByUsername(pseudonym: string): Promise<boolean>;
    getStudyOfProband(pseudonym: string): Promise<string | null>;
    deleteProbanddata(pseudonym: string, keepUsageData: boolean, isFullDeletion: boolean): Promise<void>;
    getProbandByIDS(ids: string): Promise<ProbandInternalDto | null>;
    registerProband(studyName: string, newProband: ProbandRequestInternalDto): Promise<ProbandResponseInternalDto>;
    getStudy(studyName: string): Promise<StudyInternalDto | null>;
    patchProband(pseudonym: string, attributes: Pick<ProbandInternalDto, 'status'> | Pick<ProbandInternalDto, 'complianceContact'>): Promise<void>;
}
