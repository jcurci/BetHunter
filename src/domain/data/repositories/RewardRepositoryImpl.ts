import { RewardRepository } from '../../repositories/RewardRepository';
import { ClaimRewardResult } from '../../entities/RewardClaim';
import { RewardApi } from '../../../infrastructure/services/Reward.api';

export class RewardRepositoryImpl implements RewardRepository {
  constructor(private readonly api: RewardApi) {}

  claimReward(rewardModuleId: string): Promise<ClaimRewardResult> {
    return this.api.claimReward(rewardModuleId);
  }
}
