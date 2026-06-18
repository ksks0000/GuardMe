export interface VaultCredentialSummaryPayload {
  id: string;
  serviceName: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultCredentialDetailPayload extends VaultCredentialSummaryPayload {
  password: string;
}

export interface VaultStatusPayload {
  locked: boolean;
}

export interface VaultUnlockResponsePayload {
  message: string;
  locked: boolean;
}

export interface VaultLockResponsePayload {
  message: string;
  locked: boolean;
}
