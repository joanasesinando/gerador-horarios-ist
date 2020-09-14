export enum ClassType {
    THEORY_PT = 'Teórica',
    LAB_PT = 'Laboratorial',
    PROBLEMS_PT = 'Problemas',
    SEMINARY_PT = 'Seminário',
    THEORY_EN = 'Theoretical',
    LAB_EN = 'Laboratory',
    PROBLEMS_EN = 'Problems',
    SEMINARY_EN = 'Seminary',
    TUTORIAL_ORIENTATION = 'Tutorial Orientation',
    TRAINING_PERIOD = 'Training Period',
    NONE = 'NONE FOUND'
}

export function minifyClassType(type: ClassType): string {
  switch (type) {
    case ClassType.THEORY_PT:
    case ClassType.THEORY_EN:
      return 'T';

    case ClassType.LAB_PT:
    case ClassType.LAB_EN:
      return 'L';

    case ClassType.PROBLEMS_PT:
    case ClassType.PROBLEMS_EN:
      return 'PB';

    case ClassType.SEMINARY_PT:
    case ClassType.SEMINARY_EN:
      return 'S';

    case ClassType.TUTORIAL_ORIENTATION:
      return 'O';

    case ClassType.TRAINING_PERIOD:
      return 'TP';

    case ClassType.NONE:
    default:
      return '/NA';
  }
}
