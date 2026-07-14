import { environment } from '../../../environments/environment';

const SAME_ORIGIN_API_PATH = /^\/(?:auth|health|rules|siem|ueba|vault)(?:\/|$|\?)/;

export function isApiRequest(url: string): boolean {
  const apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '');
  if (apiBaseUrl) {
    return url === apiBaseUrl || url.startsWith(`${apiBaseUrl}/`);
  }

  return SAME_ORIGIN_API_PATH.test(url);
}
