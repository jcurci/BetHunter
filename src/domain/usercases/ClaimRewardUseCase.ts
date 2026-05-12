import { RewardRepository } from '../repositories/RewardRepository';
import { ClaimRewardResult } from '../entities/RewardClaim';

export class ClaimRewardUseCase {
  constructor(private readonly repository: RewardRepository) {}

  async execute(rewardModuleId: string): Promise<ClaimRewardResult> {
    if (!rewardModuleId?.trim()) throw new Error('Módulo de recompensa inválido');
    return this.repository.claimReward(rewardModuleId);
  }
}
