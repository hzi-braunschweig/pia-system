import { ServiceClient } from '../core/serviceClient';
export declare enum SystemComplianceType {
    APP = "app",
    SAMPLES = "samples",
    BLOODSAMPLES = "bloodsamples",
    LABRESULTS = "labresults"
}
export declare class ComplianceserviceClient extends ServiceClient {
    hasAgreedToCompliance(pseudonym: string, study: string, systemCompliance: SystemComplianceType | SystemComplianceType[]): Promise<boolean>;
}
