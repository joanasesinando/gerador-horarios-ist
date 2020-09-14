export function formatTime(date: Date): string {
  let hours: any = date.getHours();
  let min: any = date.getMinutes();

  if (hours < 10) { hours = '0' + hours; }
  if (min < 10) { min = '0' + min; }
  return hours + ':' + min;
}
