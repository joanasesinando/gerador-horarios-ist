import {Shift} from './Shift';
import {Lesson} from '../Lesson/Lesson';
import {ClassType} from '../ClassType/ClassType';

class MockLesson extends Lesson {
  constructor() {
    super(undefined, undefined, undefined, undefined);
  }
}

describe('Shift', () => {
  let shift: Shift;
  let other: Shift;

  describe('Checking for overlaps', () => {

    beforeEach(() => {
      shift = new Shift(undefined, undefined, [new MockLesson(), new MockLesson()], undefined);
      other = new Shift(undefined, undefined, [new MockLesson(), new MockLesson()], undefined);
    });

    it('should overlap: one lesson overlaps', () => {
      shift.lessons.forEach((lesson, index) => {
        index === 1 ?
          spyOn(lesson, 'overlap').and.returnValue(true) :
          spyOn(lesson, 'overlap').and.returnValue(false);
      });
      expect(shift.overlap(other)).toBeTrue();
      shift.lessons.forEach(lesson => expect(lesson.overlap).toHaveBeenCalled());
    });

    it('should overlap: all lessons overlap', () => {
      shift.lessons.forEach(lesson => spyOn(lesson, 'overlap').and.returnValue(true));
      expect(shift.overlap(other)).toBeTrue();
      shift.lessons.forEach((lesson, index) => {
        index === 0 ? expect(lesson.overlap).toHaveBeenCalled() : expect(lesson.overlap).not.toHaveBeenCalled();
      });
    });

    it('should NOT overlap', () => {
      shift.lessons.forEach(lesson => spyOn(lesson, 'overlap').and.returnValue(false));
      expect(shift.overlap(other)).toBeFalse();
      shift.lessons.forEach(lesson => expect(lesson.overlap).toHaveBeenCalled());
    });
  });

  describe('Checking for equality', () => {

    beforeEach(() => {
      shift = new Shift('SN01', ClassType.THEORY_PT, [new MockLesson(), new MockLesson()], 'A');
      other = new Shift('SN01', ClassType.THEORY_PT, [new MockLesson(), new MockLesson()], 'A');
    });

    it('should be equal', () => {
      shift.lessons.forEach(lesson => spyOn(lesson, 'equal').and.returnValue(true));
      expect(shift.equal(other)).toBeTrue();
      shift.lessons.forEach(lesson => expect(lesson.equal).toHaveBeenCalled());
    });

    it('should NOT be equal: different lessons', () => {
      shift.lessons.forEach(lesson => spyOn(lesson, 'equal').and.returnValue(false));
      expect(shift.equal(other)).toBeFalse();
      shift.lessons.forEach((lesson, index) => {
        index === 0 ?
          expect(lesson.equal).toHaveBeenCalled() :
          expect(lesson.equal).not.toHaveBeenCalled();
      });
    });

    it('should NOT be equal: different name', () => {
      shift.lessons.forEach(lesson => spyOn(lesson, 'equal').and.returnValue(true));
      other.name = 'SN02';
      expect(shift.equal(other)).toBeFalse();
    });

    it('should NOT be equal: different type', () => {
      shift.lessons.forEach(lesson => spyOn(lesson, 'equal').and.returnValue(true));
      other.type = ClassType.THEORY_EN;
      expect(shift.equal(other)).toBeFalse();
    });

    it('should NOT be equal: different campus', () => {
      shift.lessons.forEach(lesson => spyOn(lesson, 'equal').and.returnValue(true));
      other.campus = 'T';
      expect(shift.equal(other)).toBeFalse();
    });
  });
});
