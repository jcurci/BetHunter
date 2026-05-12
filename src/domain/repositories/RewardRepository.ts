import { ClaimRewardResult } from '../entities/RewardClaim';

export interface RewardRepository {
  claimReward(rewardModuleId: string): Promise<ClaimRewardResult>;
}
