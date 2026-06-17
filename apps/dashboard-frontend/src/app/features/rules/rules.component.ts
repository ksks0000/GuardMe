import { AsyncPipe, DatePipe, LowerCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import {
  CreateFirewallRuleInput,
  FirewallRule,
  UpdateFirewallRuleInput,
} from '../../core/models';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { RulesActions } from '../../store/rules/rules.actions';
import {
  selectAllUserRules,
  selectRulesError,
  selectRulesLoaded,
  selectRulesLoading,
  selectRulesSaving,
  selectSystemRules,
} from '../../store/rules/rules.selectors';
import {
  RuleFormDialogComponent,
  RuleFormDialogData,
  RuleFormDialogResult,
} from './rule-form-dialog/rule-form-dialog.component';

@Component({
  selector: 'app-rules',
  imports: [
    AsyncPipe,
    DatePipe,
    LowerCasePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatTableModule,
    MatTooltipModule,
    EmptyStateComponent,
  ],
  templateUrl: './rules.component.html',
  styleUrl: './rules.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RulesComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);

  readonly systemRules$ = this.store.select(selectSystemRules);
  readonly userRules$ = this.store.select(selectAllUserRules);
  readonly loading$ = this.store.select(selectRulesLoading);
  readonly saving$ = this.store.select(selectRulesSaving);
  readonly error$ = this.store.select(selectRulesError);

  readonly ready$ = combineLatest([
    this.store.select(selectRulesLoaded),
    this.loading$,
  ]).pipe(map(([loaded, loading]) => loaded && !loading));

  readonly userRuleColumns = ['enabled', 'name', 'ruleType', 'pattern', 'action', 'updatedAt', 'actions'];

  ngOnInit(): void {
    this.store.dispatch(RulesActions.loadRules());
  }

  openCreateDialog(): void {
    this.openRuleDialog({ mode: 'create' });
  }

  openEditDialog(rule: FirewallRule): void {
    this.openRuleDialog({ mode: 'edit', rule });
  }

  onEnabledToggle(rule: FirewallRule, enabled: boolean): void {
    this.store.dispatch(
      RulesActions.updateRule({
        id: rule.id,
        input: { enabled },
      }),
    );
  }

  deleteRule(rule: FirewallRule): void {
    const label = rule.name || rule.pattern;
    const confirmed = window.confirm(`Delete firewall rule "${label}"? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    this.store.dispatch(RulesActions.deleteRule({ id: rule.id }));
  }

  dismissError(): void {
    this.store.dispatch(RulesActions.clearError());
  }

  ruleLabel(rule: FirewallRule): string {
    return rule.name?.trim() || rule.pattern;
  }

  private openRuleDialog(data: RuleFormDialogData): void {
    const dialogRef = this.dialog.open<RuleFormDialogComponent, RuleFormDialogData, RuleFormDialogResult>(
      RuleFormDialogComponent,
      {
        width: '28rem',
        disableClose: true,
        data,
      },
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      if (data.mode === 'create') {
        this.store.dispatch(
          RulesActions.createRule({ input: result.input as CreateFirewallRuleInput }),
        );
        return;
      }

      if (data.rule) {
        this.store.dispatch(
          RulesActions.updateRule({
            id: data.rule.id,
            input: result.input as UpdateFirewallRuleInput,
          }),
        );
      }
    });
  }
}
