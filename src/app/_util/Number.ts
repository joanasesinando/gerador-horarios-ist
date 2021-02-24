/* ------------------------------------------------------------
   * Format a number with commas as thousands' separators
   * 1000 -> 1,000
   * ---------------------------------------------------------- */
export function numberWithCommas(x): string {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
