import { Pipe, PipeTransform } from '@angular/core';
import * as removeMD from 'remove-markdown';

@Pipe({ name: 'stripMarkdown' })
export class StripMarkdown implements PipeTransform {
  transform(text: string): any {
    return removeMD(text);
  }
}
