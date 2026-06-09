import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { escapeHtml } from './html-escape.util';

export function loadTemplate(relativePath: string): string {
  return readFileSync(join(__dirname, '..', relativePath), 'utf8');
}

export function renderTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = variables[key];
    return value !== undefined ? escapeHtml(value) : '';
  });
}
