/* tslint:disable:typedef max-line-length triple-equals no-unused-expression radix */
declare let $;

export class Timetable {

  static create(): void{
    let transitionEnd = 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend';
    const transitionsSupported = ($('.csstransitions').length > 0);
    // if browser does not support transitions - use a different event to trigger them
    if ( !transitionsSupported ) { transitionEnd = 'noTransition'; }

    // should add a loading while the events are organized

    function SchedulePlan( element ) {
      this.element = element;
      this.timeline = $('.timeline');
      this.timelineItems = this.timeline.find('li');
      this.timelineItemsNumber = this.timelineItems.length;
      this.timelineStart = getScheduleTimestamp(this.timelineItems.eq(0).text());
      // need to store delta (in our case half hour) timestamp
      this.timelineUnitDuration = getScheduleTimestamp(this.timelineItems.eq(1).text()) - getScheduleTimestamp(this.timelineItems.eq(0).text());

      this.eventsWrapper = this.element.find('.events');
      this.eventsGroup = this.eventsWrapper.find('.events-group');
      this.singleEvents = this.eventsGroup.find('.single-event');
      this.eventSlotHeight = this.eventsGroup.eq(0).children('.top-info').outerHeight();

      this.animating = false;

      this.initSchedule();
    }

    SchedulePlan.prototype.initSchedule = function() {
      this.scheduleReset();
      this.initEvents();
    };

    SchedulePlan.prototype.scheduleReset = function() {
      const mq = this.mq();
      if ( mq == 'desktop' && !this.element.hasClass('js-full') ) {
        // in this case you are on a desktop version (first load or resize from mobile)
        this.eventSlotHeight = this.eventsGroup.eq(0).children('.top-info').outerHeight();
        this.element.addClass('js-full');
        this.placeEvents();
      } else if (  mq == 'mobile' && this.element.hasClass('js-full') ) {
        // in this case you are on a mobile version (first load or resize from desktop)
        this.eventSlotHeight = this.eventsGroup.eq(0).children('.top-info').outerHeight();
        this.element.removeClass('js-full loading');
        this.eventsGroup.children('ul').add(this.singleEvents).removeAttr('style');
        this.eventsWrapper.children('.grid-line').remove();
        this.placeEvents();
      } else {
        this.placeEvents();
        this.element.removeClass('loading');
      }
    };

    SchedulePlan.prototype.initEvents = function() {
      const self = this;

      this.singleEvents.each(function(){
        // create the .event-date element for each event
        const durationLabel = '<span class="event-date">' + $(this).data('start') + ' - ' + $(this).data('end') + '</span>';
        $(this).children('.single-event-div').prepend($(durationLabel));
        $('.event-date').css('opacity', 0.7);
      });
    };

    SchedulePlan.prototype.placeEvents = function() {
      const self = this;
      const mq = this.mq();
      this.singleEvents.each(function(){
        // place each event in the grid -> need to set top position and height
        const start = getScheduleTimestamp($(this).attr('data-start'));
        const duration = getScheduleTimestamp($(this).attr('data-end')) - start;

        const eventTop = self.eventSlotHeight * (start - self.timelineStart) / self.timelineUnitDuration;
        const eventHeight = self.eventSlotHeight * duration / self.timelineUnitDuration;

        $(this).css({
          top: (eventTop) + 'px',
          height: (eventHeight + 1) + 'px'
        });

        // FIXME: quickfix
        if (mq == 'desktop' && parseInt($(this).attr('data-start').substring(0, 2)) >= 13)  {
          $(this).css({
            top: (eventTop + 4) + 'px',
            height: (eventHeight + 1) + 'px'
          });
        }
      });

      this.element.removeClass('loading');
    };

    SchedulePlan.prototype.mq = function(){
      // get MQ value ('desktop' or 'mobile')
      const self = this;
      return window.getComputedStyle(this.element.get(0), '::before').getPropertyValue('content').replace(/["']/g, '');
    };

    const schedules = $('.cd-schedule');
    const objSchedulesPlan = [];
    let windowResize = false;

    if ( schedules.length > 0 ) {
      schedules.each(function(){
        // create SchedulePlan objects
        objSchedulesPlan.push(new SchedulePlan($(this)));
      });
    }

    $(window).on('resize', () => {
      if ( !windowResize ) {
        windowResize = true;
        (!window.requestAnimationFrame) ? setTimeout(checkResize) : window.requestAnimationFrame(checkResize);
      }
    });

    function checkResize(){
      objSchedulesPlan.forEach((element) => {
        element.scheduleReset();
      });
      windowResize = false;
    }

    function getScheduleTimestamp(time) {
      // accepts hh:mm format - convert hh:mm to timestamp
      time = time.replace(/ /g, '');
      const timeArray = time.split(':');
      // tslint:disable-next-line:radix
      const timeStamp = parseInt(timeArray[0]) * 60 + parseInt(timeArray[1]);
      return timeStamp;
    }

    function transformElement(element, value) {
      element.css({
        '-moz-transform': value,
        '-webkit-transform': value,
        '-ms-transform': value,
        '-o-transform': value,
        transform: value
      });
    }
  }

}
