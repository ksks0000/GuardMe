import { Observable } from 'rxjs';
import {
  CreateVaultCredentialInput,
  UpdateVaultCredentialInput,
  VaultCredentialDetail,
  VaultCredentialSummary,
  VaultLockResult,
  VaultStatus,
  VaultUnlockResult,
} from '../models';

export abstract class VaultApi {
  abstract getStatus(): Observable<VaultStatus>;
  abstract unlock(password: string): Observable<VaultUnlockResult>;
  abstract lock(): Observable<VaultLockResult>;
  abstract listCredentials(): Observable<VaultCredentialSummary[]>;
  abstract getCredential(id: string): Observable<VaultCredentialDetail>;
  abstract createCredential(input: CreateVaultCredentialInput): Observable<VaultCredentialSummary>;
  abstract updateCredential(
    id: string,
    input: UpdateVaultCredentialInput,
  ): Observable<VaultCredentialSummary>;
  abstract deleteCredential(id: string): Observable<void>;
}
