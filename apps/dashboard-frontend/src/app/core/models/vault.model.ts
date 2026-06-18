export interface VaultCredentialSummary {
  id: string;
  serviceName: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultCredentialDetail extends VaultCredentialSummary {
  password: string;
}

export interface VaultStatus {
  locked: boolean;
}

export interface VaultUnlockResult {
  message: string;
  locked: boolean;
}

export interface VaultLockResult {
  message: string;
  locked: boolean;
}

export interface CreateVaultCredentialInput {
  serviceName: string;
  username: string;
  password: string;
}

export interface UpdateVaultCredentialInput {
  serviceName?: string;
  username?: string;
  password?: string;
}
