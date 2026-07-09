import { parsePositiveNumber } from './env.util';

export const uebaConfig = {
  baselineWindowDays: () =>
    parsePositiveNumber(process.env.BASELINE_WINDOW_DAYS, 7),
  baselineMinSampleSize: () =>
    parsePositiveNumber(process.env.BASELINE_MIN_SAMPLE_SIZE, 50),
  baselineMaxKnownHosts: () => 500,
  alertThreshold: () => {
    const parsed = Number(process.env.UEBA_ALERT_THRESHOLD);
    if (!Number.isFinite(parsed)) {
      return 60;
    }
    return Math.min(100, Math.max(0, Math.round(parsed)));
  },
  alertCooldownMs: () => parsePositiveNumber(process.env.UEBA_ALERT_COOLDOWN_MS, 120000),
  volumeSpikeMultiplier: () => parsePositiveNumber(process.env.UEBA_VOLUME_SPIKE_MULTIPLIER, 3),
  offHoursActivityShare: () => 0.05,
  repeatedBlocksWindowMs: () => 10 * 60000,
  repeatedBlocksThreshold: () => 3,
  highRiskWindowMs: () => 15 * 60000,
  highRiskScoreThreshold: () => 70,
  newHostLookbackDays: () => 7
};
