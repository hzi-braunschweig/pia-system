import { config } from '../config';
import { PersonalDataMapperStream } from './modysImportStreams/personalDataMapperStream';
import { PersonalDataUpdateStream } from './modysImportStreams/personalDataUpdateStream';
import stream from 'stream';
import { promisify } from 'util';
import { FetchModysDataStream } from './modysImportStreams/fetchModysDataStream';
import { getStudysPseudonymsReadable } from './modysImportStreams/studysPseudonymsStream';

const pipeline = promisify(stream.pipeline);

export class ModysImportService {
  /**
   * Starts the personal data import of all pseudonyms of the configured study
   * from MODYS.
   */
  public static async startImport(): Promise<void> {
    console.log('MODYS Import: ======== START OF IMPORT ========');
    try {
      const studysPseudonymsStream = getStudysPseudonymsReadable(
        config.modys.study
      );
      const fetchModysDataStream = new FetchModysDataStream(config.modys);
      const mapperStream = new PersonalDataMapperStream();
      const personalDataSavingStream = new PersonalDataUpdateStream();

      await pipeline(
        studysPseudonymsStream,
        fetchModysDataStream,
        mapperStream,
        personalDataSavingStream
      );
    } catch (e) {
      console.log(e);
    }
    console.log('MODYS Import: ======== END OF IMPORT ========');
  }
}
