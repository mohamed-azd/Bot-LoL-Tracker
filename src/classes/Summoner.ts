import { EmbedBuilder } from "discord.js";
import RiotService from "../services/apiRiot";
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

  constructor(id: string, discordAt: string) {
    this.id = id;
    this.puuid = "";
    this.name = "";
    this.discordAt = discordAt;
    this.tier = Tier.UNRANK;
    this.rank = "";
    this.lp = 0;
    this.lastGameId = "";
    this.riotService = new RiotService();
  }

  getDiscordAt(): string {
    return `<@${this.discordAt}>`;
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

  getTotalRank(): string {
    return `${this.getDiscordAt()} est **${this.tier} ${this.rank}** ${this.lp} LP`;
  }

  async loadData() {
    const data = (await this.riotService.getSummonerById(this.id)).data;
    if (!data) return false;
    this.puuid = data.puuid;
    this.name = data.name;
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
    let result = (await this.riotService.getRank(this.id)).data;
    result = result.filter((obj: any) => obj.queueType === 'RANKED_SOLO_5x5');
    const data = result[0];
    console.log(data);
    if (!data || data?.queueType !== "RANKED_SOLO_5x5") return false;
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
    if (result.result === GameResult.REMAKE) return false;
    const { champion, score } = await this.getLastMatch(this.lastGameId);
    if (!champion) return false;
    return msgBuilder.build(result.result, result.type, result.value, this.name, champion, score);
  }

  async getLastMatch(matchId: string): Promise<{ champion: string; score: string }> {
    const matchInfos: any = await this.riotService.getGameInfos(matchId);
    const players: Array<any> = matchInfos.data.info.participants;
    let score = {
      kills: "",
      deaths: "",
      assists: "",
    };
    let champion = "";

    if (matchInfos) {
      // Find summoner
      players.forEach((player) => {
        if (player.puuid === this.puuid) {
          score.kills = player.kills;
          score.deaths = player.deaths;
          score.assists = player.assists;
          champion = player.championName;
        }
      });
    }

    return { champion: champion, score: `${score.kills} / ${score.deaths} / ${score.assists}` };
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
        // Loss at 0lp
        if (this.lp == 0 && currentLp == 0) return { result: GameResult.DEFEAT, type: "LP", value: 0 };
        // Game remake
        return { result: GameResult.REMAKE, type: "", value: 0 };
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
    } else if (this.compareTier(currentTier, this.tier) === "upgrade") {
      // Win tier
      return { result: GameResult.VICTORY, type: "TIER", value: this.tier };
    } else {
      // error
      return { result: GameResult.REMAKE, type: "", value: 0 }
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
