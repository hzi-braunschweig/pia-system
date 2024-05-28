import { ServiceClient } from '../core/serviceClient';
import { LabResultInternalDto } from '../dtos/labResult';
import { PatchSampleInternalDto } from '../dtos/sample';
export declare class SampletrackingserviceClient extends ServiceClient {
    patchSample(studyName: string, pseudonym: string, sampleId: string, sample: PatchSampleInternalDto): Promise<LabResultInternalDto>;
}
