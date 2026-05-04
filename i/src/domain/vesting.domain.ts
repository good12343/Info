export type VestingInput = {
  total: number;
  startTime: number;
  now: number;
  cliff: number;
  duration: number;
};

export const calculateUnlocked = (v: VestingInput): number => {
  if (v.now < v.startTime + v.cliff) {
    return 0;
  }

  const elapsed = v.now - v.startTime;
  const progress = Math.min(elapsed / v.duration, 1);

  return Math.floor(v.total * progress);
};

export const isFullyUnlocked = (v: VestingInput): boolean => {
  return v.now >= v.startTime + v.duration;
};