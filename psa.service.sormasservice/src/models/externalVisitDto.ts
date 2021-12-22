/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SymptomsDto } from './symptomsDto';

export interface ExternalVisitDto {
  personUuid?: string;
  disease?:
    | 'AFP'
    | 'CHOLERA'
    | 'CONGENITAL_RUBELLA'
    | 'CSM'
    | 'DENGUE'
    | 'EVD'
    | 'GUINEA_WORM'
    | 'LASSA'
    | 'MEASLES'
    | 'MONKEYPOX'
    | 'NEW_INFLUENZA'
    | 'PLAGUE'
    | 'POLIO'
    | 'UNSPECIFIED_VHF'
    | 'WEST_NILE_FEVER'
    | 'YELLOW_FEVER'
    | 'RABIES'
    | 'ANTHRAX'
    | 'CORONAVIRUS'
    | 'PNEUMONIA'
    | 'MALARIA'
    | 'TYPHOID_FEVER'
    | 'ACUTE_VIRAL_HEPATITIS'
    | 'NON_NEONATAL_TETANUS'
    | 'HIV'
    | 'SCHISTOSOMIASIS'
    | 'SOIL_TRANSMITTED_HELMINTHS'
    | 'TRYPANOSOMIASIS'
    | 'DIARRHEA_DEHYDRATION'
    | 'DIARRHEA_BLOOD'
    | 'SNAKE_BITE'
    | 'RUBELLA'
    | 'TUBERCULOSIS'
    | 'LEPROSY'
    | 'LYMPHATIC_FILARIASIS'
    | 'BURULI_ULCER'
    | 'PERTUSSIS'
    | 'NEONATAL_TETANUS'
    | 'ONCHOCERCIASIS'
    | 'DIPHTERIA'
    | 'TRACHOMA'
    | 'YAWS_ENDEMIC_SYPHILIS'
    | 'MATERNAL_DEATHS'
    | 'PERINATAL_DEATHS'
    | 'INFLUENZA_A'
    | 'INFLUENZA_B'
    | 'H_METAPNEUMOVIRUS'
    | 'RESPIRATORY_SYNCYTIAL_VIRUS'
    | 'PARAINFLUENZA_1_4'
    | 'ADENOVIRUS'
    | 'RHINOVIRUS'
    | 'ENTEROVIRUS'
    | 'M_PNEUMONIAE'
    | 'C_PNEUMONIAE'
    | 'OTHER'
    | 'UNDEFINED';
  visitDateTime?: Date;
  visitStatus?: 'UNAVAILABLE' | 'UNCOOPERATIVE' | 'COOPERATIVE';
  visitRemarks?: string;
  reportLat?: number;
  reportLon?: number;
  reportLatLonAccuracy?: number;
  symptoms: SymptomsDto;
}
