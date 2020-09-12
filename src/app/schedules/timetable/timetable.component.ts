import {Component, OnInit} from '@angular/core';

import {Timetable} from '../../_domain/Timetable';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.scss']
})
export class TimetableComponent implements OnInit {

  test = 'PREV';

  constructor() {
  }

  ngOnInit(): void {
    Timetable.create();
  }

  pin(): void {
    console.log('pin');
  }

}
