export interface BettingHouseReportPayload {
  houseName: string;
  url: string;
}

export interface BettingHouseReportRepository {
  submitReport(payload: BettingHouseReportPayload): Promise<void>;
}
