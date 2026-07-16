import { apiClient } from '../../services/api/apiClient';

export interface ValidateCouponResponse {
  valid: boolean;
  affiliateName?: string;
  message?: string;
}

export class AffiliateApi {
  async validateCoupon(coupon: string): Promise<ValidateCouponResponse> {
    const response = await apiClient.post<ValidateCouponResponse>('/affiliate/validate', { coupon });
    return response.data;
  }
}
