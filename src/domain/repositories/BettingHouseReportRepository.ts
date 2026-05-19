export interface BettingHouseReportPayload {
  url: string;
}

export interface BettingHouseReportRepository {
  submitReport(payload: BettingHouseReportPayload): Promise<void>;
}
