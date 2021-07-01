import { Transform, TransformCallback } from 'stream';
import { PersonalDataReq } from '../../models/personalData';
import { PersonSummary } from '../../models/modys';
import { config } from '../../config';
import {
  ContactDetailTypeId,
  VPersonContactDetailOverview,
} from '../../models/modysApi';

export interface PersonalDataMapperStreamOutput {
  pseudonym: string;
  personalData: PersonalDataReq;
}

export class PersonalDataMapperStream extends Transform {
  private modysProbandsCount = 0;

  public constructor() {
    /** writableHighWaterMark is the limit for the buffer that controls the concurrency
     * @see FetchModysDataStream
     */
    super({
      objectMode: true,
      writableHighWaterMark: config.modysRequestConcurrency,
    });
  }

  private static mapPersonSummaryToPersonalData(
    proband: PersonSummary
  ): PersonalDataReq {
    return {
      anrede: proband.overview.salutation,
      titel: proband.overview.title,
      name: proband.overview.name,
      vorname: proband.overview.firstname,
      strasse: proband.overview.streetName,
      haus_nr: proband.overview.streetNumber,
      plz: proband.overview.postcode,
      landkreis: proband.overview.stateFkLang,
      ort: proband.overview.cityName,
      telefon_privat: PersonalDataMapperStream.getContactDetailByTypeId(
        proband.contactDetails,
        ContactDetailTypeId.TELEFON_PRIVAT
      ),
      telefon_dienst: PersonalDataMapperStream.getContactDetailByTypeId(
        proband.contactDetails,
        ContactDetailTypeId.TELEFON_DIENST
      ),
      telefon_mobil: PersonalDataMapperStream.getContactDetailByTypeId(
        proband.contactDetails,
        ContactDetailTypeId.TELEFON_MOBIL
      ),
      email: PersonalDataMapperStream.getContactDetailByTypeId(
        proband.contactDetails,
        ContactDetailTypeId.EMAIL
      ),
    };
  }

  private static getContactDetailByTypeId(
    contactDetails: VPersonContactDetailOverview[],
    contactDetailTypeId: ContactDetailTypeId
  ): string | undefined {
    const result = contactDetails.find(
      (contactDetail) =>
        contactDetail.contactDetailTypeId === contactDetailTypeId
    );
    if (!result) {
      return undefined;
    }
    return result.value;
  }

  public _destroy(
    error: Error | null,
    callback: (error: Error | null) => void
  ): void {
    console.log(
      `MODYS Import: got ${this.modysProbandsCount} probands from MODYS.`
    );
    super._destroy(error, callback);
  }

  public async _transform(
    modysProbandPromise: Promise<PersonSummary | null>,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ): Promise<void> {
    const modysProband = await modysProbandPromise;
    if (!modysProband) {
      return callback();
    }
    this.modysProbandsCount++;
    const personalDataChunk: PersonalDataMapperStreamOutput = {
      pseudonym: modysProband.pseudonym,
      personalData:
        PersonalDataMapperStream.mapPersonSummaryToPersonalData(modysProband),
    };
    this.push(personalDataChunk);
    callback();
  }
}
