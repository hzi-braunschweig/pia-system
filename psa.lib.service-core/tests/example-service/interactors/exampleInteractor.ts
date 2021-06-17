import { Nullable } from '../../../src/utils/types';
import { Example } from '../models/example';

export class ExampleInteractor {
  public static getExample(name: string): Nullable<Example> {
    return {
      name: name,
      age: 21,
    };
  }
}
