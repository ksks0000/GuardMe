import { parsePositiveNumber } from './env.util';

export const vaultConfig = {
  kdfMemoryCost: () =>
    parsePositiveNumber(process.env.VAULT_KDF_MEMORY_COST, 19456),
  kdfTimeCost: () => parsePositiveNumber(process.env.VAULT_KDF_TIME_COST, 2),
  keyLengthBytes: () => 32,
  ivLengthBytes: () => 12,
};
