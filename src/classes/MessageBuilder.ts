import { EmbedBuilder } from "discord.js";
import GameResult from "../types/gameResult";
import Summoner from "./Summoner";
import Tier from "../types/tier";

export default class MessageBuilder {
  private summoner: Summoner;
  private embedBuilder: EmbedBuilder = new EmbedBuilder();

  constructor(summoner: Summoner) {
    this.summoner = summoner;
  }

  build(gameResult: GameResult, type: string, value: any, champion: string, score: string): EmbedBuilder | boolean {
    if (gameResult === GameResult.REMAKE) return false;
    this.embedBuilder.setTitle(gameResult);
    // Add champion and score
    this.embedBuilder.addFields({ name: "Champion", value: champion }, { name: "Score", value: score });
    // Add champion image
    this.embedBuilder.setThumbnail(`https://ddragon.leagueoflegends.com/cdn/11.11.1/img/champion/${champion}.png`)
    switch (type.toUpperCase()) {
      case "LP": {
        return this.buildLp(gameResult, value);
      }

      case "RANK": {
        return this.buildRank(gameResult, value);
      }

      case "TIER": {
        return this.buildTier(gameResult, value);
      }

      default: {
        return false;
      }
    }
  }

  buildLp(gameResult: GameResult, value: number): EmbedBuilder {
    if (gameResult === GameResult.DEFEAT) {
      if (value === 0) {
        this.embedBuilder.addFields({ name: " ", value: `Aïe aïe aïe, défaite à 0 LP pour ${this.summoner.getDiscordAt()}\nTu vas descendre ! :joy: :index_pointing_at_the_viewer: ` }).setColor("Red");
      } else {
        this.embedBuilder.addFields({ name: " ", value: `**-${value} LP**` }).setColor("Red");
      }
    } else if (gameResult === GameResult.VICTORY) {
      this.embedBuilder.addFields({ name: " ", value: `**+ ${value} LP**` }).setColor("Green");
    }
    this.embedBuilder.setDescription(this.summoner.getTotalRank());
    return this.embedBuilder;
  }

  buildRank(gameResult: GameResult, value: string): EmbedBuilder {
    if (gameResult === GameResult.DEFEAT) {
      this.embedBuilder.setDescription(`${this.summoner.getDiscordAt()} est descendu **${this.summoner.getTier()} ${value}**`).setColor("DarkRed");
    } else if (gameResult === GameResult.VICTORY) {
      this.embedBuilder.setDescription(`${this.summoner.getDiscordAt()} est monté **${this.summoner.getTier()} ${value}**`).setColor("DarkGreen");
    }
    return this.embedBuilder;
  }

  buildTier(gameResult: GameResult, value: Tier): EmbedBuilder {
    if (gameResult === GameResult.DEFEAT) {
      this.embedBuilder.setDescription(`${this.summoner.getDiscordAt()} est descendu **${value}**`).setColor("NotQuiteBlack");
    } else if (gameResult === GameResult.VICTORY) {
      this.embedBuilder.setDescription(`${this.summoner.getDiscordAt()} est monté **${value}**`).setColor("Gold");
    }
    return this.embedBuilder;
  }
}
