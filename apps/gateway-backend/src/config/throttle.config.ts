import { parsePositiveNumber } from './env.util';

export const throttleConfig = {
  ttlMs: () => parsePositiveNumber(process.env.THROTTLE_TTL_MS, 60000),
  limit: () => parsePositiveNumber(process.env.THROTTLE_LIMIT, 100),
  authLimit: () => parsePositiveNumber(process.env.THROTTLE_AUTH_LIMIT, 5),
};
