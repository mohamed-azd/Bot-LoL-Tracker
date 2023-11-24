import RiotService from "../service/apiRiot";
import Tier from "../types/tier";

class Summoner {
  private id: string;
  private puuid: string;
  private name: string;
  private tier: Tier;
  private rank: string;
  private lp: number;
  private riotService: RiotService;

  constructor(name: string) {
    this.id = "";
    this.puuid = "";
    this.name = name;
    this.tier = Tier.UNRANK;
    this.rank = "";
    this.lp = 0;
    this.riotService = new RiotService();
  }

  getName(): string {
    return this.name;
  }

  getTier(): Tier {
    return this.tier;
  }

  getRank(): string {
    return this.rank;
  }

  getLp(): number {
    return this.lp;
  }

  getTotalRank() : string {
    return `**${this.name}** est ${this.tier} ${this.rank} ${this.lp} LP`
  }

  async loadData() {
    const data = (await this.riotService.getSummonerByName(this.name)).data;
    if (!data) return false;
    this.id = data.id;
    this.puuid = data.puuid;
    await this.loadRank();
  }

  async loadRank() {
    const data = (await this.riotService.getRank(this.id)).data[0];
    if (!data) return false;
    this.tier = this.strToTier(data.tier);
    this.rank = data.rank;
    this.lp = data.leaguePoints;
  }

  async check(): Promise<string | boolean> {
    const currentTier = this.tier;
    const currentRank = this.rank;
    const currentLp = this.lp;
    await this.loadData();
    return this.compareTotalRank(currentTier, currentRank, currentLp);
  }

  compareTotalRank(currentTier: Tier, currentRank: string, currentLp: number): string | boolean {
    const message = `\n${this.tier} ${this.rank} ${this.lp} LP`;

    // Same tier
    if (this.compareTier(currentTier, this.tier) === "same") {
      // Same rank
      if (this.compareRank(currentRank, this.rank) === "same") {
        // Loss lp
        if (this.lp > currentLp) return `${this.name} vient de perdre -${currentLp - this.lp} LP` + message;
        // Win lp
        if (this.lp < currentLp) return `${this.name} vient de gagner +${currentLp - this.lp} LP` + message;
        return false; // no change
      } else if (this.compareRank(currentRank, this.rank) === "downgrade") {
        // Loss rank
        return `${this.name} vient de descendre ${this.tier} ${this.rank}` + message;
      } else {
        // Win rank
        return `${this.name} vient de monter ${this.tier} ${this.rank}` + message;
      }
    } else if (this.compareTier(currentTier, this.tier) === "downgrade") {
      // Loss tier
      return `${this.name} vient de descendre ${this.tier}` + message;
    } else {
      // Win tier
      return `${this.name} vient de monter ${this.tier}` + message;
    }
  }

  compareTier(currentTier: Tier, newTier: Tier) {
    const order = ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"];
    if (order.indexOf(currentTier) < order.indexOf(newTier)) return "upgrade";
    if (order.indexOf(currentTier) > order.indexOf(newTier)) return "downgrade";
    if (order.indexOf(currentTier) === order.indexOf(newTier)) return "same";
  }

  compareRank(currentRank: string, newRank: string) {
    const order = ["IV", "III", "II", "I"];
    if (order.indexOf(currentRank) < order.indexOf(newRank)) return "upgrade";
    if (order.indexOf(currentRank) > order.indexOf(newRank)) return "downgrade";
    if (order.indexOf(currentRank) === order.indexOf(newRank)) return "same";
  }

  getData() {
    return {
      name: this.name,
      tier: this.tier,
      rank: this.rank,
      lp: this.lp,
    };
  }

  strToTier(tier: string): Tier {
    switch (tier.toUpperCase()) {
      case "IRON": {
        return Tier.IRON;
      }

      case "BRONZE": {
        return Tier.BRONZE;
      }

      case "SILVER": {
        return Tier.SILVER;
      }

      case "GOLD": {
        return Tier.GOLD;
      }

      case "PLATINUM": {
        return Tier.PLATINUM;
      }

      case "EMERALD": {
        return Tier.EMERALD;
      }

      case "DIAMOND": {
        return Tier.DIAMOND;
      }

      case "MASTER": {
        return Tier.MASTER;
      }

      case "GRANDMASTER": {
        return Tier.GRANDMASTER;
      }

      case "CHALLENGER": {
        return Tier.CHALLENGER;
      }

      default: {
        return Tier.UNRANK;
      }
    }
  }
}

export default Summoner;
