import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  CreateFirewallRuleInput,
  FIREWALL_RULE_ACTIONS,
  FIREWALL_RULE_TYPES,
  FirewallRule,
  FirewallRuleAction,
  FirewallRuleType,
  UpdateFirewallRuleInput,
} from '../../../core/models';

export interface RuleFormDialogData {
  mode: 'create' | 'edit';
  rule?: FirewallRule;
}

export interface RuleFormDialogResult {
  input: CreateFirewallRuleInput | UpdateFirewallRuleInput;
}

@Component({
  selector: 'app-rule-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './rule-form-dialog.component.html',
  styleUrl: './rule-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RuleFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RuleFormDialogComponent, RuleFormDialogResult>);
  readonly data = inject<RuleFormDialogData>(MAT_DIALOG_DATA);

  readonly ruleTypes = Object.values(FIREWALL_RULE_TYPES);
  readonly ruleActions = Object.values(FIREWALL_RULE_ACTIONS);

  readonly form = this.fb.nonNullable.group({
    name: [this.data.rule?.name ?? '', [Validators.maxLength(100)]],
    ruleType: [this.data.rule?.ruleType ?? FIREWALL_RULE_TYPES.DOMAIN, Validators.required],
    pattern: [
      this.data.rule?.pattern ?? '',
      [Validators.required, Validators.minLength(1), Validators.maxLength(253)],
    ],
    action: [this.data.rule?.action ?? FIREWALL_RULE_ACTIONS.BLOCK, Validators.required],
  });

  readonly title = this.data.mode === 'create' ? 'Add firewall rule' : 'Edit firewall rule';

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, ruleType, pattern, action } = this.form.getRawValue();
    const trimmedName = name.trim();

    const input: CreateFirewallRuleInput | UpdateFirewallRuleInput = {
      ruleType: ruleType as FirewallRuleType,
      pattern: pattern.trim(),
      action: action as FirewallRuleAction,
    };

    if (trimmedName) {
      input.name = trimmedName;
    } else if (this.data.mode === 'edit') {
      input.name = '';
    }

    this.dialogRef.close({ input });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  protected patternHint(): string {
    const ruleType = this.form.controls.ruleType.value;
    return ruleType === FIREWALL_RULE_TYPES.IP
      ? 'IPv4 address, e.g. 203.0.113.10'
      : 'Hostname or domain, e.g. example.net';
  }
}
