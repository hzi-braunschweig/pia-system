import { Request } from '@hapi/hapi';

import { Example } from '../models/example';
import { Nullable } from '../../../src/utils/types';
import { ExampleInteractor } from '../interactors/exampleInteractor';

export class ExampleHandler {
  public static getExample(this: void, request: Request): Nullable<Example> {
    if (!request.params['name']) {
      return null;
    }
    return ExampleInteractor.getExample(request.params['name']);
  }
}
