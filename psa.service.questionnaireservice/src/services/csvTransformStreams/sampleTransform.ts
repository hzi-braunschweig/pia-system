import { NasalSwapSample } from '../../models/sample';
import { CsvSampleRow } from '../../models/csvExportRows';
import { CsvTransform } from './csvTransform';

export class SampleTransform extends CsvTransform<
  NasalSwapSample,
  CsvSampleRow
> {
  /**
   * Transforms a sample into a csv sample line object.
   */
  protected convertToCsvRow(sample: NasalSwapSample): CsvSampleRow {
    let status = '';
    if (sample.study_status === 'deleted') {
      status = 'gelöscht';
    } else {
      if (sample.status === 'analyzed') status = 'analysiert';
      else if (sample.status === 'new') status = 'neu';
      else if (sample.status === 'sampled') status = 'genommen';
    }
    return {
      Proben_ID: sample.id,
      Bakt_Proben_ID: sample.dummy_sample_id ? sample.dummy_sample_id : '.',
      Proband: sample.user_id,
      Status: status,
      Bemerkung: sample.remark ? sample.remark : '.',
    };
  }
}
