/* ------------------------------------------------------------
   * Converts date to time in HH:mm format.
   * date -> HH:mm
   * ---------------------------------------------------------- */
export function formatTime(date: Date): string {
  let hours: any = date.getHours();
  let min: any = date.getMinutes();

  if (hours < 10) hours = '0' + hours;
  if (min < 10) min = '0' + min;
  return hours + ':' + min;
}

/* ------------------------------------------------------------
   * Converts time to timestamp. Accepts HH:mm format.
   * HH:mm -> timestamp
   * ---------------------------------------------------------- */
export function getTimestamp(time: string): number {
  time = time.replace(/ /g, '');
  const timeArray = time.split(':');
  const hours = timeArray[0];
  const min = timeArray[1];
  return parseInt(hours, 10) * 60 + parseInt(min, 10);
}

/* ------------------------------------------------------------
   * Checks if two dates are on the same week
   * ---------------------------------------------------------- */
export function isSameWeek(date1: Date, date2: Date): boolean {
  const MILLISECONDS_IN_A_WEEK = 604800000;
  const minDate = date1 < date2 ? date1 : date2;
  const maxDate = minDate === date1 ? date2 : date1;
  const minWeekday = minDate.getDay();
  const maxWeekday = maxDate.getDay();

  return !(maxDate.getTime() - minDate.getTime() >= MILLISECONDS_IN_A_WEEK || minWeekday > maxWeekday);
}

/* ------------------------------------------------------------
   * Gets weekday (full english version)
   * ---------------------------------------------------------- */
export function getWeekday(day: number): string {
  switch (day) {
    case 1:
      return 'monday';
    case 2:
      return 'tuesday';
    case 3:
      return 'wednesday';
    case 4:
      return 'thursday';
    case 5:
      return 'friday';
    case 6:
      return 'saturday';
    case 7:
      return 'sunday';
  }
}

/* ------------------------------------------------------------
   * Gets weekday (minified version)
   * ---------------------------------------------------------- */
export function getMinifiedWeekday(day: number, language: string): string {
  if (language === 'pt-PT') {
    switch (day) {
      case 1:
        return 'Seg';
      case 2:
        return 'Ter';
      case 3:
        return 'Qua';
      case 4:
        return 'Qui';
      case 5:
        return 'Sex';
      case 6:
        return 'Sáb';
      case 7:
        return 'Dom';
    }
  } else {
    switch (day) {
      case 1:
        return 'Mon';
      case 2:
        return 'Tue';
      case 3:
        return 'Wed';
      case 4:
        return 'Thu';
      case 5:
        return 'Fri';
      case 6:
        return 'Sat';
      case 7:
        return 'Sun';
    }
  }
}
