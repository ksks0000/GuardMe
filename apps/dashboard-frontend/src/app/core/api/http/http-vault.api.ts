import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateVaultCredentialInput,
  UpdateVaultCredentialInput,
  VaultCredentialDetail,
  VaultCredentialSummary,
  VaultLockResult,
  VaultStatus,
  VaultUnlockResult,
} from '../../models';
import { VaultApi } from '../vault.api';

@Injectable()
export class HttpVaultApi extends VaultApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/vault`;

  getStatus(): Observable<VaultStatus> {
    return this.http.get<VaultStatus>(`${this.baseUrl}/status`);
  }

  unlock(password: string): Observable<VaultUnlockResult> {
    return this.http.post<VaultUnlockResult>(`${this.baseUrl}/unlock`, { password });
  }

  lock(): Observable<VaultLockResult> {
    return this.http.post<VaultLockResult>(`${this.baseUrl}/lock`, null);
  }

  listCredentials(): Observable<VaultCredentialSummary[]> {
    return this.http.get<VaultCredentialSummary[]>(`${this.baseUrl}/credentials`);
  }

  getCredential(id: string): Observable<VaultCredentialDetail> {
    return this.http.get<VaultCredentialDetail>(`${this.baseUrl}/credentials/${id}`);
  }

  createCredential(input: CreateVaultCredentialInput): Observable<VaultCredentialSummary> {
    return this.http.post<VaultCredentialSummary>(`${this.baseUrl}/credentials`, input);
  }

  updateCredential(
    id: string,
    input: UpdateVaultCredentialInput,
  ): Observable<VaultCredentialSummary> {
    return this.http.patch<VaultCredentialSummary>(`${this.baseUrl}/credentials/${id}`, input);
  }

  deleteCredential(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/credentials/${id}`).pipe(map(() => undefined));
  }
}
