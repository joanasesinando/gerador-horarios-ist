import {Lesson} from './Lesson';

describe('Lesson', () => {
  const START = '2020-09-05 09:30:00';
  const END = '2020-09-05 11:00:00';
  const ROOM = 'QA02.2';
  const CAMPUS = 'Alameda';

  let lesson: Lesson;

  beforeEach(() => {
    lesson = new Lesson(new Date(START), new Date(END), ROOM, CAMPUS);
  });

  it('should create', () => {
    expect(lesson).toBeTruthy();
  });


  /* ----------------------------
   * Should overlap
   * ---------------------------- */
  it('should overlap (L2 -- L1 -- L2 -- L1)', () => {
    const other = new Lesson(new Date('2020-09-05 09:00:00'), new Date('2020-09-05 10:30:00'), ROOM, CAMPUS);
    expect(lesson.overlap(other)).toBeTrue();
  });

  it('should overlap (L1 -- L2 -- L1 -- L2)', () => {
    const other = new Lesson(new Date('2020-09-05 10:00:00'), new Date('2020-09-05 11:30:00'), ROOM, CAMPUS);
    expect(lesson.overlap(other)).toBeTrue();
  });

  it('should overlap: L2 in L1 (L1 -- L2 -- L2 -- L1)', () => {
    const other = new Lesson(new Date('2020-09-05 10:00:00'), new Date('2020-09-05 10:30:00'), ROOM, CAMPUS);
    expect(lesson.overlap(other)).toBeTrue();
  });

  it('should overlap: L1 in L2 (L2 -- L1 -- L1 -- L2)', () => {
    const other = new Lesson(new Date('2020-09-05 09:00:00'), new Date('2020-09-05 11:30:00'), ROOM, CAMPUS);
    expect(lesson.overlap(other)).toBeTrue();
  });

  it('should overlap: starting at the same time (L1 = L2 -- L1 -- L2)', () => {
    const other = new Lesson(new Date(START), new Date('2020-09-05 11:30:00'), ROOM, CAMPUS);
    expect(lesson.overlap(other)).toBeTrue();
  });

  it('should overlap: ending at the same time (L2 -- L1 -- L1 = L2)', () => {
    const other = new Lesson(new Date('2020-09-05 09:00:00'), new Date(END), ROOM, CAMPUS);
    expect(lesson.overlap(other)).toBeTrue();
  });

  it('should overlap: equal (L1 = L2)', () => {
    const other = new Lesson(new Date(START), new Date(END), ROOM, CAMPUS);
    expect(lesson.overlap(other)).toBeTrue();
  });

  it('should overlap: same time & week day, different weeks', () => {
    const other = new Lesson(new Date(START), new Date(END), ROOM, CAMPUS);
    other.start.setDate(other.start.getDate() + 7);
    other.end.setDate(other.end.getDate() - 7);
    expect(lesson.overlap(other)).toBeTrue();
  });


  /* ----------------------------
   * Should NOT overlap
   * ---------------------------- */
  it('should NOT overlap (L1 -- L1 -- L2 -- L2)', () => {
    const other = new Lesson(new Date('2020-09-05 11:30:00'), new Date('2020-09-05 13:00:00'), ROOM, CAMPUS);
    expect(lesson.overlap(other)).toBeFalse();
  });

  it('should NOT overlap (L2 -- L2 -- L1 -- L1)', () => {
    const other = new Lesson(new Date('2020-09-05 08:00:00'), new Date('2020-09-05 09:00:00'), ROOM, CAMPUS);
    expect(lesson.overlap(other)).toBeFalse();
  });

  it('should NOT overlap: lessons in a row (L1 -- L1 = L2 -- L2)', () => {
    const other = new Lesson(new Date('2020-09-05 11:00:00'), new Date('2020-09-05 12:30:00'), ROOM, CAMPUS);
    expect(lesson.overlap(other)).toBeFalse();
  });

  it('should NOT overlap: lessons in a row (L2 -- L2 = L1 -- L1)', () => {
    const other = new Lesson(new Date('2020-09-05 08:00:00'), new Date('2020-09-05 09:30:00'), ROOM, CAMPUS);
    expect(lesson.overlap(other)).toBeFalse();
  });

  it('should NOT overlap: same time & week, different week day', () => {
    const other = new Lesson(new Date(START), new Date(END), ROOM, CAMPUS);
    other.start.setDate(other.start.getDate() - 1);
    other.end.setDate(other.end.getDate() - 1);
    expect(lesson.overlap(other)).toBeFalse();
  });

});
