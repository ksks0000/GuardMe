import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  CreateVaultCredentialInput,
  UpdateVaultCredentialInput,
  VaultCredentialSummary,
} from '../../core/models';

export const VaultActions = createActionGroup({
  source: 'Vault',
  events: {
    'Load Status': emptyProps(),
    'Load Status Success': props<{ locked: boolean }>(),
    'Load Status Failure': props<{ error: string }>(),
    'Unlock Vault': props<{ password: string }>(),
    'Unlock Vault Success': props<{ locked: boolean }>(),
    'Unlock Vault Failure': props<{ error: string }>(),
    'Lock Vault': emptyProps(),
    'Lock Vault Success': props<{ locked: boolean }>(),
    'Lock Vault Failure': props<{ error: string }>(),
    'Load Credentials': emptyProps(),
    'Load Credentials Success': props<{ credentials: VaultCredentialSummary[] }>(),
    'Load Credentials Failure': props<{ error: string }>(),
    'Create Credential': props<{ input: CreateVaultCredentialInput }>(),
    'Create Credential Success': props<{ credential: VaultCredentialSummary }>(),
    'Create Credential Failure': props<{ error: string }>(),
    'Update Credential': props<{ id: string; input: UpdateVaultCredentialInput }>(),
    'Update Credential Success': props<{ credential: VaultCredentialSummary }>(),
    'Update Credential Failure': props<{ error: string }>(),
    'Delete Credential': props<{ id: string }>(),
    'Delete Credential Success': props<{ id: string }>(),
    'Delete Credential Failure': props<{ error: string }>(),
    'Reveal Credential': props<{ id: string }>(),
    'Reveal Credential Success': props<{ id: string; password: string }>(),
    'Reveal Credential Failure': props<{ error: string }>(),
    'Clear Error': emptyProps(),
    'Clear Unlock Error': emptyProps(),
  },
});
