import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {faTimesCircle} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-pill',
  templateUrl: './pill.component.html',
  styleUrls: ['./pill.component.scss']
})
export class PillComponent implements OnInit {

  @Input() label: string;
  @Input() marginRight: boolean;

  @Output() deleteClicked = new EventEmitter<string>();

  faTimesCircle = faTimesCircle;

  constructor() { }

  ngOnInit(): void {
  }

}
