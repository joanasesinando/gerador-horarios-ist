interface String {
  isEmpty(): boolean;
}

/**
 * Checks if string is empty.
 *
 * @return true, if has no alphanumeric characters
 * @return false, otherwise
 */
String.prototype.isEmpty = function(): boolean {
  return this.replace(/\s*/g, '') === '';
};
