import {Class} from './Class';
import {Course} from './Course';
import {ClassType} from './ClassType';
import {Shift} from './Shift';
import {Lesson} from './Lesson';

describe('Class', () => {
  const SHIFTS = [
    new Shift('T01', [ClassType.THEORY_PT], [
      new Lesson(new Date('2020-09-07 09:30'), new Date('2020-09-07 11:00'), 'QA02.2', 'Alameda'),
      new Lesson(new Date('2020-09-09 10:00'), new Date('2020-09-09 11:30'), 'QA02.2', 'Alameda')
    ]),
    new Shift('T02', [ClassType.THEORY_PT], [
      new Lesson(new Date('2020-09-07 11:00'), new Date('2020-09-07 12:30'), 'QA02.2', 'Alameda'),
      new Lesson(new Date('2020-09-09 11:30'), new Date('2020-09-09 13:00'), 'QA02.2', 'Alameda')
    ])
  ];
  const COURSE = new Course(846035542878562, 'Bases de Dados', 'BD225179577', [ClassType.THEORY_PT],
                    ['Alameda'], SHIFTS, { Teórica: 3, Laboratorial: 1.5});

  let cl: Class;

  beforeEach(() => {
    cl = new Class(COURSE, [COURSE.shifts[0]]);
  });

  it('should create', () => {
    expect(cl).toBeTruthy();
  });


  /* ----------------------------
   * Should overlap
   * ---------------------------- */
  it('should overlap: one shift overlaps', () => {
    const shifts = [
      new Shift('T01', [ClassType.THEORY_PT], [
        new Lesson(new Date('2020-09-07 09:00'), new Date('2020-09-07 10:00'), 'QA02.2', 'Alameda'),
        new Lesson(new Date('2020-09-10 10:00'), new Date('2020-09-10 11:30'), 'QA02.2', 'Alameda')
      ]),
      new Shift('T02', [ClassType.THEORY_PT], [
        new Lesson(new Date('2020-09-08 11:00'), new Date('2020-09-08 12:30'), 'QA02.2', 'Alameda'),
        new Lesson(new Date('2020-09-10 11:30'), new Date('2020-09-10 13:00'), 'QA02.2', 'Alameda')
      ])
    ];
    const other = new Class(COURSE, shifts);
    expect(cl.overlap(other)).toBeTrue();
  });

  it('should overlap: all shifts overlap', () => {
    const other = new Class(COURSE, SHIFTS);
    expect(cl.overlap(other)).toBeTrue();
  });


  /* ----------------------------
   * Should NOT overlap
   * ---------------------------- */
  it('should NOT overlap: same week days', () => {
    const shifts = [
      new Shift('T01', [ClassType.THEORY_PT], [
        new Lesson(new Date('2020-09-07 08:00'), new Date('2020-09-07 09:30'), 'QA02.2', 'Alameda'),
        new Lesson(new Date('2020-09-09 08:30'), new Date('2020-09-09 10:00'), 'QA02.2', 'Alameda')
      ]),
      new Shift('T02', [ClassType.THEORY_PT], [
        new Lesson(new Date('2020-09-07 14:00'), new Date('2020-09-07 15:30'), 'QA02.2', 'Alameda'),
        new Lesson(new Date('2020-09-09 15:30'), new Date('2020-09-09 17:00'), 'QA02.2', 'Alameda')
      ])
    ];
    const other = new Class(COURSE, shifts);
    expect(cl.overlap(other)).toBeFalse();
  });

  it('should NOT overlap: different week days', () => {
    const shifts = [
      new Shift('T01', [ClassType.THEORY_PT], [
        new Lesson(new Date('2020-09-08 09:30'), new Date('2020-09-08 11:00'), 'QA02.2', 'Alameda'),
        new Lesson(new Date('2020-09-10 10:00'), new Date('2020-09-10 11:30'), 'QA02.2', 'Alameda')
      ]),
      new Shift('T02', [ClassType.THEORY_PT], [
        new Lesson(new Date('2020-09-08 11:00'), new Date('2020-09-08 12:30'), 'QA02.2', 'Alameda'),
        new Lesson(new Date('2020-09-10 11:30'), new Date('2020-09-10 13:00'), 'QA02.2', 'Alameda')
      ])
    ];
    const other = new Class(COURSE, shifts);
    expect(cl.overlap(other)).toBeFalse();
  });
});
