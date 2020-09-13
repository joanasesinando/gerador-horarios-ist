import {Injectable} from '@angular/core';

declare let $;

@Injectable({
  providedIn: 'root'
})
export class TimetableService {

  timetableSchedulesObjs: TimetableSchedule[] = [];

  constructor() { }

  createTimetable(): void {
    const schedules = $('.schedule');

    if (schedules.length > 0) {
      schedules.map((index, element) => {
        this.timetableSchedulesObjs.push(new TimetableSchedule($(element)));
      });
    }
  }
}

export class TimetableSchedule {

  SLOT_HEIGHT_DESKTOP = 50;
  SLOT_HEIGHT_MOBILE = 40;

  private _timeline: any;
  private _timelineItems: any;
  private _timelineStart: number;
  private _timelineUnitDuration: number;

  private _eventsWrapper: any;
  private _eventsGroup: any;
  private _singleEvents: any;
  private _eventSlotHeight: any;

  constructor(private _element: any) {
    this.timeline = $('.timeline');
    this.timelineItems = this.timeline.find('li');
    this.timelineStart = this.getTimestamp(this.timelineItems.eq(0).text());
    this.timelineUnitDuration = this.getTimestamp(this.timelineItems.eq(1).text()) - this.getTimestamp(this.timelineItems.eq(0).text());

    this.eventsWrapper = this.element.find('.events');
    this.eventsGroup = this.eventsWrapper.find('.events-group');
    this.singleEvents = this.eventsGroup.find('.single-event');
    this.eventSlotHeight = window.innerWidth < 800 ? this.SLOT_HEIGHT_MOBILE : this.SLOT_HEIGHT_DESKTOP;

    this.initSchedule();
  }

  get element(): any { return this._element; }
  set element(value: any) { this._element = value; }

  get timeline(): any { return this._timeline; }
  set timeline(value: any) { this._timeline = value; }

  get timelineItems(): any { return this._timelineItems; }
  set timelineItems(value: any) { this._timelineItems = value; }

  get timelineStart(): any { return this._timelineStart; }
  set timelineStart(value: any) { this._timelineStart = value; }

  get timelineUnitDuration(): any { return this._timelineUnitDuration; }
  set timelineUnitDuration(value: any) { this._timelineUnitDuration = value; }

  get eventsWrapper(): any { return this._eventsWrapper; }
  set eventsWrapper(value: any) { this._eventsWrapper = value; }

  get eventsGroup(): any { return this._eventsGroup; }
  set eventsGroup(value: any) { this._eventsGroup = value; }

  get singleEvents(): any { return this._singleEvents; }
  set singleEvents(value: any) { this._singleEvents = value; }

  get eventSlotHeight(): any { return this._eventSlotHeight; }
  set eventSlotHeight(value: any) { this._eventSlotHeight = value; }


  initSchedule(): void {
    this.eventSlotHeight = window.innerWidth < 800 ? this.SLOT_HEIGHT_MOBILE : this.SLOT_HEIGHT_DESKTOP;
    this.placeEvents();
  }

  placeEvents(): void {
    // Place each event in the grid - sets top position & height
    this.singleEvents.map((index, element) => {
      const start = this.getTimestamp($(element).attr('data-start'));
      const duration = this.getTimestamp($(element).attr('data-end')) - start;

      const eventTop = this.eventSlotHeight * (start - this.timelineStart) / this.timelineUnitDuration;
      const eventHeight = this.eventSlotHeight * duration / this.timelineUnitDuration;

      $(element).css({
        top: (eventTop) + 'px',
        height: (eventHeight) + 'px'
      });
    });
  }

  /* ----------------------------------------------------------
   * Converts time to timestamp. Accepts HH:mm format.
   * ---------------------------------------------------------- */
  getTimestamp(time: string): number {
    time = time.replace(/ /g, '');
    const timeArray = time.split(':');
    const hours = timeArray[0];
    const min = timeArray[1];
    return parseInt(hours, 10) * 60 + parseInt(min, 10);
  }
}
