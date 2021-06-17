import { Component, EventEmitter, Input, Output } from '@angular/core';
import 'datejs';

@Component({
  selector: 'app-timestamp-answer-option',
  templateUrl: './timestamp-answer-option.component.html',
  styleUrls: ['timestamp-answer-option.component.scss'],
})
export class TimestampAnswerOptionComponent {
  constructor() {}

  @Input() timestamp: any;
  @Output() timestampChanged = new EventEmitter();
  @Input() hideButton = false;

  setTimestamp(): void {
    this.timestamp = Date.now();
    this.timestampChanged.emit(this.timestamp);
  }

  textInputBlurred(value): void {
    this.timestamp = Date.parseExact(value, 'H:m dd.MM.yy');
    this.timestampChanged.emit(this.timestamp);
  }
}
