export interface AcquisitionSourcePayload {
  /** Já em UPPER_SNAKE, no formato do enum do backend. */
  source: string;
  sourceOther?: string | null;
}

export interface AcquisitionSourceRepository {
  submit(payload: AcquisitionSourcePayload): Promise<void>;
}
