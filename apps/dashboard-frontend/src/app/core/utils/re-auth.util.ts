import { environment } from '../../../environments/environment';

export function isReAuthStale(lastAuthAt: string | null | undefined): boolean {
  if (!lastAuthAt) {
    return true;
  }

  const elapsed = Date.now() - new Date(lastAuthAt).getTime();
  return elapsed > environment.reAuthTimeoutMinutes * 60 * 1000;
}
