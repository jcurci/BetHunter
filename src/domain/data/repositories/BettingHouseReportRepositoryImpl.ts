import type {
  BettingHouseReportPayload,
  BettingHouseReportRepository,
} from '../../repositories/BettingHouseReportRepository';
import { BettingHouseReportApi } from '../../../infrastructure/services/BettingHouseReport.api';

export class BettingHouseReportRepositoryImpl implements BettingHouseReportRepository {
  constructor(private readonly api: BettingHouseReportApi) {}

  submitReport(payload: BettingHouseReportPayload): Promise<void> {
    return this.api.submitReport(payload);
  }
}
