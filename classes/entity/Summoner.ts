import { EmbedBuilder } from "discord.js";
import RiotService from "../service/apiRiot";
import GameResult from "../types/gameResult";
import Tier from "../types/tier";
import MessageBuilder from "./MessageBuilder";

class Summoner {
  private id: string;
  private puuid: string;
  private name: string;
  private discordAt: string;
  private tier: Tier;
  private rank: string;
  private lp: number;
  private lastGameId: string;
  private riotService: RiotService;

  constructor(name: string, discordAt: string) {
    this.id = "";
    this.puuid = "";
    this.name = name;
    this.discordAt = discordAt;
    this.tier = Tier.UNRANK;
    this.rank = "";
    this.lp = 0;
    this.lastGameId = "";
    this.riotService = new RiotService();
  }

  getName(): string {
    return this.name;
  }

  getDiscordAt(): string {
    return `<@${this.discordAt}>`;
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

  getTotalRank(): string {
    return `${this.getDiscordAt} est **${this.tier} ${this.rank}** ${this.lp} LP`;
  }

  async loadData() {
    const data = (await this.riotService.getSummonerByName(this.name)).data;
    if (!data) return false;
    this.id = data.id;
    this.puuid = data.puuid;
    if (!(await this.getLastGameId())) return false;
    if (!(await this.loadRank())) return false;
    return true;
  }

  async getLastGameId() {
    const data = (await this.riotService.getLastGameId(this.puuid)).data;
    if (!data) return false;
    this.lastGameId = data[0];
    return true;
  }

  async loadRank() {
    const data = (await this.riotService.getRank(this.id)).data[0];
    if (!data) return false;
    this.tier = this.strToTier(data.tier);
    this.rank = data.rank;
    this.lp = data.leaguePoints;
    return true;
  }

  async check(): Promise<EmbedBuilder | boolean> {
    const oldTier = this.tier;
    const oldRank = this.rank;
    const oldLp = this.lp;
    const oldLastGameId = this.lastGameId;
    if (!(await this.loadData())) return false;
    if (oldLastGameId === this.lastGameId) return false;
    const msgBuilder = new MessageBuilder(this);
    const result = this.compareTotalRank(oldTier, oldRank, oldLp);
    if (!result) return false;
    return msgBuilder.build(result.result, result.type, result.value);
  }

  compareTotalRank(currentTier: Tier, currentRank: string, currentLp: number): Compare {
    // Same tier
    if (this.compareTier(currentTier, this.tier) === "same") {
      // Same rank
      if (this.compareRank(currentRank, this.rank) === "same") {
        // Win lp
        if (this.lp > currentLp) return { result: GameResult.VICTORY, type: "LP", value: this.lp - currentLp };
        // Loss lp
        if (this.lp < currentLp) return { result: GameResult.DEFEAT, type: "LP", value: currentLp - this.lp };
        return { result: GameResult.DEFEAT, type: "LP", value: 0 }; // Loss at 0lp
      } else if (this.compareRank(currentRank, this.rank) === "downgrade") {
        // Loss rank
        return { result: GameResult.DEFEAT, type: "RANK", value: this.rank };
      } else {
        // Win rank
        return { result: GameResult.VICTORY, type: "RANK", value: this.rank };
      }
    } else if (this.compareTier(currentTier, this.tier) === "downgrade") {
      // Loss tier
      return { result: GameResult.DEFEAT, type: "TIER", value: this.tier };
    } else {
      // Win tier
      return { result: GameResult.VICTORY, type: "TIER", value: this.tier };
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

type Compare = {
  result: GameResult;
  type: string;
  value: Tier | string | number;
};

export default Summoner;
