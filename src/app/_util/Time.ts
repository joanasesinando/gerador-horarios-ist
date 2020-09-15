export function formatTime(date: Date): string {
  let hours: any = date.getHours();
  let min: any = date.getMinutes();

  if (hours < 10) { hours = '0' + hours; }
  if (min < 10) { min = '0' + min; }
  return hours + ':' + min;
}

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
