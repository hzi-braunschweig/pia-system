export declare type ProfessionalRole = 'Forscher' | 'ProbandenManager' | 'EinwilligungsManager' | 'Untersuchungsteam';
export declare type Role = ProfessionalRole | 'Proband';
export interface CreateAccountRequestInternalDto {
    username: string;
    password: string;
    role: Role;
    pwChangeNeeded: boolean;
    initialPasswordValidityDate?: Date;
}
