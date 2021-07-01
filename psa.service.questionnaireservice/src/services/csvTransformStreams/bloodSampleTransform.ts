import { BloodSample } from '../../models/sample';
import { CsvBloodSampleRow } from '../../models/csvExportRows';
import { CsvTransform } from './csvTransform';

export class BloodSampleTransform extends CsvTransform<
  BloodSample,
  CsvBloodSampleRow
> {
  /**
   * Transforms a blood sample into a csv blood sample line object.
   */
  protected convertToCsvRow(sample: BloodSample): CsvBloodSampleRow {
    return {
      Blutproben_ID: sample.sample_id,
      Proband: sample.user_id,
      Status: sample.blood_sample_carried_out ? 'genommen' : 'nicht genommen',
      Bemerkung: sample.remark ? sample.remark : '.',
    };
  }
}
