import {Lesson} from './Lesson';
import {TestingService} from '../../_util/testing.service';

describe('Lesson', () => {
  const testingService = new TestingService();
  let lesson: Lesson;

  describe('Checking for overlaps', () => {

    beforeEach(() => {
      lesson = testingService.createTimeOnlyLesson('mon', '09:30', '11:00');
    });

    /* ----------------------------
     * Should overlap
     * ---------------------------- */
    it('should overlap (L2 -- L1 -- L2 -- L1)', () => {
      const other = testingService.createTimeOnlyLesson('mon', '09:00', '10:30');
      expect(lesson.overlap(other)).toBeTrue();
    });

    it('should overlap (L1 -- L2 -- L1 -- L2)', () => {
      const other = testingService.createTimeOnlyLesson('mon', '10:00', '11:30');
      expect(lesson.overlap(other)).toBeTrue();
    });

    it('should overlap: L2 in L1 (L1 -- L2 -- L2 -- L1)', () => {
      const other = testingService.createTimeOnlyLesson('mon', '10:00', '10:30');
      expect(lesson.overlap(other)).toBeTrue();
    });

    it('should overlap: L1 in L2 (L2 -- L1 -- L1 -- L2)', () => {
      const other = testingService.createTimeOnlyLesson('mon', '09:00', '11:30');
      expect(lesson.overlap(other)).toBeTrue();
    });

    it('should overlap: starting at the same time (L1 = L2 -- L1 -- L2)', () => {
      const other = testingService.createTimeOnlyLesson('mon', '09:30', '11:30');
      expect(lesson.overlap(other)).toBeTrue();
    });

    it('should overlap: starting at the same time (L1 = L2 -- L2 -- L1)', () => {
      const other = testingService.createTimeOnlyLesson('mon', '09:30', '10:00');
      expect(lesson.overlap(other)).toBeTrue();
    });

    it('should overlap: ending at the same time (L2 -- L1 -- L1 = L2)', () => {
      const other = testingService.createTimeOnlyLesson('mon', '09:00', '11:00');
      expect(lesson.overlap(other)).toBeTrue();
    });

    it('should overlap: ending at the same time (L1 -- L2 -- L1 = L2)', () => {
      const other = testingService.createTimeOnlyLesson('mon', '10:00', '11:00');
      expect(lesson.overlap(other)).toBeTrue();
    });

    it('should overlap: equal (L1 = L2)', () => {
      const other = testingService.createTimeOnlyLesson('mon', '09:30', '11:00');
      expect(lesson.overlap(other)).toBeTrue();
    });

    it('should overlap: same time & week day, different weeks', () => {
      const other = testingService.createTimeOnlyLesson('mon', '09:30', '11:00');
      other.start.setDate(other.start.getDate() + 7);
      other.end.setDate(other.end.getDate() + 7);
      expect(lesson.overlap(other)).toBeTrue();
    });


    /* ----------------------------
     * Should NOT overlap
     * ---------------------------- */
    it('should NOT overlap (L1 -- L1 -- L2 -- L2)', () => {
      const other = testingService.createTimeOnlyLesson('mon', '11:30', '13:00');
      expect(lesson.overlap(other)).toBeFalse();
    });

    it('should NOT overlap (L2 -- L2 -- L1 -- L1)', () => {
      const other = testingService.createTimeOnlyLesson('mon', '08:00', '09:00');
      expect(lesson.overlap(other)).toBeFalse();
    });

    it('should NOT overlap: lessons in a row (L1 -- L1 = L2 -- L2)', () => {
      const other = testingService.createTimeOnlyLesson('mon', '11:00', '12:30');
      expect(lesson.overlap(other)).toBeFalse();
    });

    it('should NOT overlap: lessons in a row (L2 -- L2 = L1 -- L1)', () => {
      const other = testingService.createTimeOnlyLesson('mon', '08:00', '09:30');
      expect(lesson.overlap(other)).toBeFalse();
    });

    it('should NOT overlap: same time & week, different week day', () => {
      const other = testingService.createTimeOnlyLesson('mon', '09:30', '11:00');
      other.start.setDate(other.start.getDate() + 1);
      other.end.setDate(other.end.getDate() + 1);
      expect(lesson.overlap(other)).toBeFalse();
    });
  });

  describe('Printing', () => {
    it('should print a lesson in the pt-PT format: Seg, 08:00 - 09:00', () => {
      lesson = testingService.createTimeOnlyLesson('mon', '08:00', '09:00');
      expect(lesson.print('pt-PT')).toBe('Seg, 08:00 - 09:00');
    });

    it('should print a lesson in the en-GB format: Mon, 08:00 - 09:00', () => {
      lesson = testingService.createTimeOnlyLesson('mon', '08:00', '09:00');
      expect(lesson.print('en-GB')).toBe('Mon, 08:00 - 09:00');
    });
  });

  describe('Checking for equality', () => {

    beforeEach(() => {
      lesson = testingService.createTimeOnlyLesson('mon', '09:00', '10:00');
    });

    it('should be equal: same week', () => {
      const other = testingService.createTimeOnlyLesson('mon', '09:00', '10:00');
      expect(lesson.equal(other)).toBeTrue();
    });

    it('should be equal: different weeks', () => {
      const other = testingService.createTimeOnlyLesson('mon', '09:00', '10:00');
      other.start.setDate(other.start.getDate() + 7);
      other.end.setDate(other.end.getDate() + 7);
      expect(lesson.equal(other)).toBeTrue();
    });

    it('should NOT be equal: different start time', () => {
      const other = testingService.createTimeOnlyLesson('mon', '09:30', '10:00');
      expect(lesson.equal(other)).toBeFalse();
    });

    it('should NOT be equal: different end time', () => {
      const other = testingService.createTimeOnlyLesson('mon', '09:00', '10:30');
      expect(lesson.equal(other)).toBeFalse();
    });

    it('should NOT be equal: different start and end time', () => {
      const other = testingService.createTimeOnlyLesson('mon', '09:30', '10:30');
      expect(lesson.equal(other)).toBeFalse();
    });

    it('should NOT be equal: different room', () => {
      const other = testingService.createTimeOnlyLesson('mon', '09:00', '10:00');
      other.room = 'R2';
      expect(lesson.equal(other)).toBeFalse();
    });

    it('should NOT be equal: different campus', () => {
      const other = testingService.createTimeOnlyLesson('mon', '09:00', '10:00');
      other.campus = 'Taguspark';
      expect(lesson.equal(other)).toBeFalse();
    });
  });
});
