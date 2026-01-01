import {EmbedBuilder} from 'discord.js';
import GameResult from '../types/gameResult';
import Summoner from './Summoner';
import {GameSummary} from "../types/GameSummary";
import {RankChangeType} from "../types/RankChangeType";

export default class MessageBuilder {
	private summoner: Summoner;
	private embedBuilder: EmbedBuilder = new EmbedBuilder();

	constructor(summoner: Summoner) {
		this.summoner = summoner;
	}

	build(
		gameSummary: GameSummary,
		champion: string,
		score: string,
		duration: number,
		opggLink: string
	): EmbedBuilder | boolean {
		if (gameSummary.result === GameResult.REMAKE) return false;

		const gameDuration = this.formatGameDuration(duration);
		this.embedBuilder.setTitle(gameSummary.result);
		this.embedBuilder.addFields(
			{ name: 'Champion', value: champion },
			{ name: 'Score', value: score },
			{ name: 'Durée', value: gameDuration },
			{ name: 'Détails', value: `[**OPGG**](${opggLink})` }
		);
		this.embedBuilder.setThumbnail(`https://ddragon.leagueoflegends.com/cdn/15.2.1/img/champion/${champion}.png`);

		let message;
		switch (gameSummary.type) {
			case RankChangeType.LP: {
				message = this.buildLp(gameSummary.result, gameSummary.lpDiff);
				break;
			}
			case RankChangeType.RANK: {
				message = this.buildRank(gameSummary.result);
				break;
			}
			case RankChangeType.TIER: {
				message = this.buildTier(gameSummary.result);
				break;
			}
			default: {
				message = false;
				break;
			}
		}
		this.buildLpDiff(gameSummary.lpDiff, gameSummary.result);

		return message;
	}

	buildLp(gameResult: GameResult, lpDiff: number): EmbedBuilder {
		if (gameResult === GameResult.DEFEAT) {
			if (lpDiff === 0) {
				this.embedBuilder
					.addFields({
						name: ' ',
						value: `Aïe aïe aïe, défaite à 0 LP pour ${this.summoner.getDiscordAt()}\nTu vas descendre ! :joy: :index_pointing_at_the_viewer: `,
					})
					.setColor('Red');
			}
		}
		this.embedBuilder.setDescription(this.summoner.getTotalRank());
		return this.embedBuilder;
	}

	buildRank(gameResult: GameResult): EmbedBuilder {
		let description = "";
		const color = gameResult === GameResult.DEFEAT ? 'DarkRed' : 'DarkGreen';
		if (gameResult === GameResult.DEFEAT) {
			description = `*Descente **${this.summoner.getTier()} ${this.summoner.getRank()}** *`;
		} else if (gameResult === GameResult.VICTORY) {
			description = `*Montée **${this.summoner.getTier()} ${this.summoner.getRank()}** *`;
		}
		description += `\n\n${this.summoner.getTotalRank()}`;
		this.embedBuilder.setDescription(description).setColor(color);
		return this.embedBuilder;
	}

	buildTier(gameResult: GameResult): EmbedBuilder {
		let description = "";
		const color = gameResult === GameResult.DEFEAT ? 'NotQuiteBlack' : 'Gold';
		if (gameResult === GameResult.DEFEAT) {
			description = `Descente en **${this.summoner.getTier()}**`;
		} else if (gameResult === GameResult.VICTORY) {
			description = `*Montée en **${this.summoner.getTier()}** *`;
		}
		description += `\n\n${this.summoner.getTotalRank()}`;
		this.embedBuilder.setDescription(description).setColor(color);
		return this.embedBuilder;
	}

	formatGameDuration(duration: number) {
		const minutes = Math.floor(duration / 60);
		const seconds = duration % 60;

		const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;

		return `${minutes}:${formattedSeconds}`;
	}

	buildLpDiff(lpDiff: number, gameResult: GameResult) {
		const prefix = gameResult == GameResult.DEFEAT ? "-" : gameResult == GameResult.VICTORY ? "+" : "";
		this.embedBuilder.addFields({ name: ' ', value: `**${prefix}${Math.abs(lpDiff)} LP**` });
	}
}
