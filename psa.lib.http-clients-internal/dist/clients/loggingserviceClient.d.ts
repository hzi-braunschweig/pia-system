import { ServiceClient } from '../core/serviceClient';
import { SystemLogInternalDto, SystemLogRequestInternalDto } from '../dtos/systemLog';
export declare class LoggingserviceClient extends ServiceClient {
    createSystemLog(log: SystemLogRequestInternalDto): Promise<SystemLogInternalDto>;
}
