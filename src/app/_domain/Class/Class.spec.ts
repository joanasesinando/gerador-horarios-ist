import {Class} from './Class';
import {Shift} from '../Shift/Shift';

class MockShift extends Shift {
  constructor() {
    super(undefined, undefined, undefined, undefined);
  }
}

describe('Class', () => {
  let cl: Class;
  let other: Class;

  beforeEach(() => {
    cl = new Class(undefined, [new MockShift(), new MockShift()]);
    other = new Class(undefined, [new MockShift(), new MockShift()]);
  });

  it('should overlap: one shift overlaps', () => {
    cl.shifts.forEach((shift, index) => {
      index === 1 ?
        spyOn(shift, 'overlap').and.returnValue(true) :
        spyOn(shift, 'overlap').and.returnValue(false);
    });
    expect(cl.overlap(other)).toBeTrue();
    cl.shifts.forEach(shift => expect(shift.overlap).toHaveBeenCalled());
  });

  it('should overlap: all shifts overlap', () => {
    cl.shifts.forEach(shift => spyOn(shift, 'overlap').and.returnValue(true));
    expect(cl.overlap(other)).toBeTrue();
    cl.shifts.forEach((shift, index) => {
      index === 0 ? expect(shift.overlap).toHaveBeenCalled() : expect(shift.overlap).not.toHaveBeenCalled();
    });
  });

  it('should NOT overlap', () => {
    cl.shifts.forEach(shift => spyOn(shift, 'overlap').and.returnValue(false));
    expect(cl.overlap(other)).toBeFalse();
    cl.shifts.forEach(shift => expect(shift.overlap).toHaveBeenCalled());
  });
});
