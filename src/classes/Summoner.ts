import RiotService from "../services/apiRiot";
import GameResult from "../types/gameResult";
import Tier from "../types/tier";
import MessageBuilder from "./MessageBuilder";
import RankCalculator from "../utils/RankCalculator";
import {GameSummary} from "../types/GameSummary";
import {RankChangeType} from "../types/RankChangeType";

class Summoner {
  private puuid: string;
  private name: string;
  private discordAt: string;
  private tier: Tier;
  private rank: string;
  private lp: number;
  private lastGameId: string;
  private riotService: RiotService;

  constructor(name: string, puuid: string, discordAt: string) {
    this.puuid = puuid;
    this.name = name;
    this.discordAt = discordAt;
    this.tier = Tier.UNRANKED;
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

  getGlobalScore(): number {
    return RankCalculator.getGlobalLp(this.tier, this.rank, this.lp);
  }

  async loadData() {
    const response = await this.riotService.getSummonerByPuuid(this.puuid);
    const data = response.data;
    if (!data) throw new Error(`Summoner data not found for PUUID: ${this.puuid}`);

    this.puuid = data.puuid;
    await this.getLastGameId();
    await this.loadRank();
  }

  async getLastGameId() {
    const response = await this.riotService.getLastGameId(this.puuid);
    const data = response.data;
    if (!data || data.length === 0) throw new Error(`No match history found for ${this.name}`);

    this.lastGameId = data[0];
  }

  async loadRank() {
    let result = (await this.riotService.getRank(this.puuid)).data;
    result = result.filter((obj: any) => obj.queueType === 'RANKED_SOLO_5x5');
    const data = result[0];

    if (!data || data?.queueType !== "RANKED_SOLO_5x5") {
       this.tier = Tier.UNRANKED;
       throw new Error(`No SOLO/DUO rank found for ${this.name}`);
    }

    this.tier = this.strToTier(data.tier);
    this.rank = data.rank;
    this.lp = data.leaguePoints;
  }

  async check() {
    const oldTier = this.tier;
    const oldRank = this.rank;
    const oldLp = this.lp;
    const oldLastGameId = this.lastGameId;

    await this.loadData();
    if (oldLastGameId === this.lastGameId) return null;

    const { champion, score, duration, playerName, playerTag } = await this.getLastMatch(this.lastGameId);
    if (!champion) throw new Error(`Could not retrieve match details for game ${this.lastGameId}`);

    const msgBuilder = new MessageBuilder(this);
    const gameSummary = this.compareTotalRank(oldTier, oldRank, oldLp);
    if (gameSummary.result === GameResult.REMAKE) return null;

    const opggLink = this.getOpggLink(playerName, playerTag);
    return msgBuilder.build(gameSummary, champion, score, duration, opggLink);
  }

  async getLastMatch(matchId: string): Promise<{ champion: string; score: string, duration: number, playerName: string, playerTag: string }> {
    const matchInfos: any = await this.riotService.getGameInfos(matchId);
    const players: Array<any> = matchInfos.data.info.participants;
    const duration = matchInfos.data.info.gameDuration;

    let score = {
      kills: "",
      deaths: "",
      assists: "",
    };
    let champion = "";
    let playerName = "";
    let playerTag = "";

    if (matchInfos) {
      // Find summoner
      players.forEach((player) => {
        if (player.puuid === this.puuid) {
          score.kills = player.kills;
          score.deaths = player.deaths;
          score.assists = player.assists;
          champion = player.championName;
          playerName = player.riotIdGameName
          playerTag = player.riotIdTagline
        }
      });

    }

    return { champion: champion, score: `${score.kills} / ${score.deaths} / ${score.assists}`, duration, playerName, playerTag };
  }

  getOpggLink(playerName: string, playerTag: string) : string {
    playerName = playerName.replace(/\s/g, '%20')
    return `https://www.op.gg/summoners/euw/${playerName}-${playerTag}`
  }

  compareTotalRank(currentTier: Tier, currentRank: string, currentLp: number): GameSummary {
    const lpDiff = RankCalculator.getLpDiff(currentTier, currentRank, currentLp, this.tier, this.rank, this.lp);

    // Same tier
    if (this.compareTier(currentTier, this.tier) === "same") {
      // Same rank
      if (this.compareRank(currentRank, this.rank) === "same") {
        // Win lp
        if (this.lp > currentLp) return { result: GameResult.VICTORY, type: RankChangeType.LP, lpDiff: lpDiff };
        // Loss lp
        if (this.lp < currentLp) return { result: GameResult.DEFEAT, type: RankChangeType.LP, lpDiff: lpDiff };
        // Loss at 0lp
        if (this.lp == 0 && currentLp == 0) return { result: GameResult.DEFEAT, type: RankChangeType.LP, lpDiff: 0 };
        // Game remake
        return { result: GameResult.REMAKE, type: RankChangeType.NOTHING, lpDiff: 0 };
      } else if (this.compareRank(currentRank, this.rank) === "downgrade") {
        // Loss rank
        return { result: GameResult.DEFEAT, type: RankChangeType.RANK, lpDiff: lpDiff };
      } else {
        // Win rank
        return { result: GameResult.VICTORY, type: RankChangeType.RANK, lpDiff: lpDiff };
      }
    } else if (this.compareTier(currentTier, this.tier) === "downgrade") {
      // Loss tier
      return { result: GameResult.DEFEAT, type: RankChangeType.TIER, lpDiff: lpDiff };
    } else if (this.compareTier(currentTier, this.tier) === "upgrade") {
      // Win tier
      return { result: GameResult.VICTORY, type: RankChangeType.TIER, lpDiff: lpDiff };
    } else {
      // error
      return { result: GameResult.REMAKE, type: RankChangeType.NOTHING, lpDiff: 0 }
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

  toString() {
    return `${this.getName()} (${this.getTier()} ${this.getRank()} ${this.getLp()})`;
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
        return Tier.UNRANKED;
      }
    }
  }
}



export default Summoner;
