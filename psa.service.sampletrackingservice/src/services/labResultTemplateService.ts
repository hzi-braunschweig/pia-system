/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { LabResultTemplate } from '../entities/labResultTemplate';
import { getRepository } from 'typeorm';

export class LabResultTemplateService {
  public static async getTemplate(study: string): Promise<string> {
    const template = await getRepository(LabResultTemplate).findOne({
      where: { study },
    });

    if (template) {
      return template.markdownText;
    }

    return `|  |  |   |
| --- | --- | --- |
<img src="/assets/images/mhh_logo.gif" alt="MHH LOGO" width="180"> | <img src="/assets/images/pia_logo.png" alt="PIA LOGO" width="120"> | <img src="/assets/images/hzi_logo.jpg" alt="HZI LOGO" width="280"> |

| Institut für Virologie |
| :--------------------- |
| Leiter: Prof. Dr. T. F. Schulz |
| Carl-Neuberg-Straße 1 |
| 30625 Hannover |


|  |  |
| --- | --- |
| Studienpseudonym: | {{user_id}} |
| Proben-ID: | {{id}} |
| Material: | Nasenabstrich |
| Abnahmedatum: | {{date_of_sampling}} |
| Status: | {{status}} |

**Ergebnismitteilung**

<pia-laboratory-result-table>
    <pia-laboratory-result-table-entry name="Adenovirus-PCR (resp.)"></pia-laboratory-result-table-entry>
    <pia-laboratory-result-table-entry name="Corona 229E PCR"></pia-laboratory-result-table-entry>
    <pia-laboratory-result-table-entry name="Corona HKU1 PCR"></pia-laboratory-result-table-entry>
    <pia-laboratory-result-table-entry name="Corona NL63 PCR"></pia-laboratory-result-table-entry>
    <pia-laboratory-result-table-entry name="Corona OC43 PCR"></pia-laboratory-result-table-entry>
    <pia-laboratory-result-table-entry name="HMPV-PCR"></pia-laboratory-result-table-entry>
    <pia-laboratory-result-table-entry name="Influenza-A-PCR"></pia-laboratory-result-table-entry>
    <pia-laboratory-result-table-entry name="Influenza-B-PCR"></pia-laboratory-result-table-entry>
    <pia-laboratory-result-table-entry name="Parainfluenza-1-PCR"></pia-laboratory-result-table-entry>
    <pia-laboratory-result-table-entry name="Parainfluenza-2-PCR"></pia-laboratory-result-table-entry>
    <pia-laboratory-result-table-entry name="Parainfluenza-3-PCR"></pia-laboratory-result-table-entry>
    <pia-laboratory-result-table-entry name="Parainfluenza-4-PCR"></pia-laboratory-result-table-entry>
    <pia-laboratory-result-table-entry name="Rhinovirus-PCR"></pia-laboratory-result-table-entry>
    <pia-laboratory-result-table-entry name="RSV-PCR"></pia-laboratory-result-table-entry>
    <pia-laboratory-result-table-entry name="SARS-CoV-2 RNA"></pia-laboratory-result-table-entry>
</pia-laboratory-result-table>

Positiv bedeutet, dass in dem Nasenabstrich das entsprechende Virus nachgewiesen wurde. Negativ bedeutet, dass in dem Nasenabstrich das entsprechende Virus nicht nachgewiesen wurde.

Hinweis: Es handelt sich um einen selbstentnommenen Nasenabstrich im Rahmen einer wissenschaftlichen Studie. Die Ergebnismitteilung stellt keine ärztliche Diagnose dar.`;
  }

  public static async updateTemplate(
    study: string,
    markdownText: string
  ): Promise<{ study: string; markdownText: string }> {
    const conflictPaths: (keyof LabResultTemplate)[] = ['study'];
    const entity = {
      markdownText,
      study,
    };
    await getRepository(LabResultTemplate).upsert(entity, {
      conflictPaths: conflictPaths,
    });
    return entity;
  }
}
