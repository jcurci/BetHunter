import type {
  AcquisitionSourcePayload,
  AcquisitionSourceRepository,
} from '../../repositories/AcquisitionSourceRepository';
import { AcquisitionSourceApi } from '../../../infrastructure/services/AcquisitionSource.api';

export class AcquisitionSourceRepositoryImpl implements AcquisitionSourceRepository {
  constructor(private readonly api: AcquisitionSourceApi) {}

  submit(payload: AcquisitionSourcePayload): Promise<void> {
    return this.api.submit(payload);
  }
}
