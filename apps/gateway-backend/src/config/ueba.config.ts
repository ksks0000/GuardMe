import { parsePositiveNumber } from './env.util';

export const uebaConfig = {
  baselineWindowDays: () =>
    parsePositiveNumber(process.env.BASELINE_WINDOW_DAYS, 7),
  baselineMinSampleSize: () =>
    parsePositiveNumber(process.env.BASELINE_MIN_SAMPLE_SIZE, 50),
  baselineMaxKnownHosts: () => 500,
};
