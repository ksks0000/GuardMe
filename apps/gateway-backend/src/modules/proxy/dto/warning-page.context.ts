export interface WarningPageContext {
  url: string;
  reason: string;
  threatSummary: string;
  timestamp: Date;
  riskScore: number;
  proceedUrl: string;
}
