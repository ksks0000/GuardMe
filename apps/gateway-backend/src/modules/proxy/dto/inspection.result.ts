export interface InspectionResult {
  method: string;
  normalizedUrl: string;
  destinationHost: string;
  destinationPort: number | null;
  destinationScheme: 'http' | 'https';
  isFileDownload: boolean;
  fileName: string | null;
  bypassToken: string | null;
}
