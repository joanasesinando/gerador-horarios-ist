import {Shift} from './Shift';
import {ClassType} from '../ClassType/ClassType';
import {Lesson} from '../Lesson/Lesson';

describe('Shift', () => {
  const NAME = 'T01';
  const TYPE = ClassType.THEORY_PT;
  const LESSONS = [
    new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'QA02.2', 'Alameda'),
    new Lesson(new Date('2020-09-09 10:00'), new Date('2020-09-09 11:30'), 'QA02.2', 'Alameda')
  ];
  const CAMPUS = 'Alameda';

  let shift: Shift;

  beforeEach(() => {
    shift = new Shift(NAME, TYPE, LESSONS, CAMPUS);
  });

  it('should create', () => {
    expect(shift).toBeTruthy();
  });


  /* ----------------------------
   * Should overlap
   * ---------------------------- */
  it('should overlap: one lesson overlaps', () => {
    const lessons = [
      new Lesson(new Date('2020-09-07 09:00'), new Date('2020-09-07 10:00'), 'QA02.2', 'Alameda'),
      new Lesson(new Date('2020-09-10 10:00'), new Date('2020-09-10 11:30'), 'QA02.2', 'Alameda')
    ];
    const other = new Shift('T01', ClassType.THEORY_PT, lessons, 'Alameda');
    expect(shift.overlap(other)).toBeTrue();
  });

  it('should overlap: all lessons overlap', () => {
    const lessons = [
      new Lesson(new Date('2020-09-07 09:00'), new Date('2020-09-07 10:00'), 'QA02.2', 'Alameda'),
      new Lesson(new Date('2020-09-09 10:30'), new Date('2020-09-09 11:30'), 'QA02.2', 'Alameda')
    ];
    const other = new Shift('T01', ClassType.THEORY_PT, lessons, 'Alameda');
    expect(shift.overlap(other)).toBeTrue();
  });


  /* ----------------------------
   * Should NOT overlap
   * ---------------------------- */
  it('should NOT overlap: same week days', () => {
    const lessons = [
      new Lesson(new Date('2020-09-14 08:00'), new Date('2020-09-14 09:00'), 'QA02.2', 'Alameda'),
      new Lesson(new Date('2020-09-16 12:00'), new Date('2020-09-09 13:00'), 'QA02.2', 'Alameda')
    ];
    const other = new Shift('T01', ClassType.THEORY_PT, lessons, 'Alameda');
    expect(shift.overlap(other)).toBeFalse();
  });

  it('should NOT overlap: different week days', () => {
    const lessons = [
      new Lesson(new Date('2020-09-06 09:30'), new Date('2020-09-06 11:00'), 'QA02.2', 'Alameda'),
      new Lesson(new Date('2020-09-08 10:00'), new Date('2020-09-08 11:30'), 'QA02.2', 'Alameda')
    ];
    const other = new Shift('T01', ClassType.THEORY_PT, lessons, 'Alameda');
    expect(shift.overlap(other)).toBeFalse();
  });
});
