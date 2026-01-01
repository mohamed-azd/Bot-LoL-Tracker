import Tier from "../types/tier";

export default class RankCalculator {
    private static readonly TIER_VALUES: Record<Tier, number> = {
        [Tier.UNRANKED]: 0,
        [Tier.IRON]: 0,
        [Tier.BRONZE]: 400,
        [Tier.SILVER]: 800,
        [Tier.GOLD]: 1200,
        [Tier.PLATINUM]: 1600,
        [Tier.EMERALD]: 2000,
        [Tier.DIAMOND]: 2400,
        [Tier.MASTER]: 2800,
        [Tier.GRANDMASTER]: 2800,
        [Tier.CHALLENGER]: 2800,
    }

    private static readonly RANK_VALUES: Record<string, number> = {
        "IV": 0,
        "III": 100,
        "II": 200,
        "I": 300,
    }

    static getGlobalLp(tier: Tier, rank: string, lp: number): number {
        const tierValue = this.TIER_VALUES[tier];
        const rankValue = this.RANK_VALUES[rank] || 0;
        return tierValue + rankValue + lp;
    }

    static getLpDiff(oldTier: Tier, oldRank: string, oldLp: number, newTier: Tier, newRank: string, newLp: number): number {
        const oldScore = this.getGlobalLp(oldTier, oldRank, oldLp);
        const newScore = this.getGlobalLp(newTier, newRank, newLp);
        return newScore - oldScore;
    }
}