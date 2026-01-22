import {Component, Input, Output, EventEmitter, AfterViewInit, OnInit} from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

import {Course} from '../../_domain/Course/Course';
import {ClassType} from '../../_domain/ClassType/ClassType';
import {Degree} from '../../_domain/Degree/Degree';
import {StateService} from '../../_services/state/state.service';

declare let $;

@Component({
  selector: 'app-course-card',
  templateUrl: './course-card.component.html',
  styleUrls: ['./course-card.component.scss']
})
export class CourseCardComponent implements AfterViewInit, OnInit {

  @Input() course: Course;
  selectedTypes: ClassType[] = [];

  @Output() campusSelected = new EventEmitter<{courseID: number, campus: string}>();
  @Output() typesOfClassesSelected = new EventEmitter<{courseID: number, types: ClassType[]}>();
  @Output() removeBtn = new EventEmitter<number>();
  @Output() individualLessonsToggled = new EventEmitter<{courseID: number, type: ClassType, enabled: boolean}>();

  faTimes = faTimes;

  constructor(public stateService: StateService) {
  }


  ngOnInit(): void {
    this.selectedTypes = this.course?.types ? [...this.course.types] : [];
  }

  ngAfterViewInit(): void {
    this.campusPicked(this.course);
  }

  formatName(name: string): string {
    return name.replace(/[ ,]/g, '');
  }

  hasDefaultCampus(degree: Degree): boolean {
    switch (degree.acronym) {
      case 'LEIC-A':
      case 'LEIC-T':
      case 'MEIC-A':
      case 'MEIC-T':
        return true;

      default:
        return false;
    }
  }

  setCampusBasedOnDefault(degree: Degree, campus: string): boolean {
    switch (degree.acronym) {
      case 'LEIC-A':
      case 'MEIC-A':
        return campus === 'Alameda';

      case 'LEIC-T':
      case 'MEIC-T':
        return campus === 'Taguspark';
    }
  }

  campusPicked(course): void {
    const radioBtns = $('input[name^=radioCampus-' + this.formatName(course.acronym) + ']');
    for (const btn of radioBtns) {
      if (btn.checked)
        this.campusSelected.emit({courseID: course.id, campus: btn.labels[0].innerText});
    }
  }

  typesOfClassesPicked(course): void {
    const checkboxes = $('input[name^=checkTypeClass-' + this.formatName(course.acronym) + ']');
    const typesChecked: ClassType[] = [];
    for (const box of checkboxes) {
      if (box.checked) typesChecked.push(box.labels[0].innerText);
    }

    this.selectedTypes = typesChecked;

    if (course?.individualLessonTypes?.length) {
      course.individualLessonTypes = course.individualLessonTypes.filter(t => typesChecked.includes(t));
    }

    this.typesOfClassesSelected.emit({courseID: course.id, types: typesChecked});
  }


  isTypeSelected(type: ClassType): boolean {
    return this.selectedTypes?.includes(type) ?? false;
  }

  canEnableIndividualLessons(course: Course, type: ClassType): boolean {
    const shifts = (course.shifts ?? []).filter(s => s.type === type);
    if (shifts.length < 2) return false; // need at least 2 shifts for mixing to be meaningful

    const counts = shifts.map(s => (s.lessons ? s.lessons.length : 0));
    const max = Math.max(...counts, 0);
    if (max < 2) return false; // no slot splitting possible

    // Safety: each slot must exist in at least one shift
    for (let slot = 0; slot < max; slot++) {
      const candidates = shifts.filter(s => s.lessons && s.lessons[slot]);
      if (candidates.length === 0) return false;
    }
    return true;
  }


  onIndividualLessonsToggle(course: Course, type: ClassType, enabled: boolean): void {
    if (!this.canEnableIndividualLessons(course, type)) {
      course.setIndividualLessonEnabled(type, false);
      this.individualLessonsToggled.emit({courseID: course.id, type, enabled: false});
      return;
    }

    course.setIndividualLessonEnabled(type, enabled);
    this.individualLessonsToggled.emit({courseID: course.id, type, enabled});
  }



  removeBtnClicked(): void {
    this.removeBtn.emit(this.course.id);
  }

}
