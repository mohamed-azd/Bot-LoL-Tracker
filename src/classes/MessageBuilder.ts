import {EmbedBuilder} from 'discord.js';
import GameResult from '../types/gameResult';
import Summoner from './Summoner';
import {GameSummary} from "../types/GameSummary";
import {RankChangeType} from "../types/RankChangeType";
import {SummonerRole} from "../types/SummonerRole";

const ROLE_ICON_BASE_URL = 'https://cdn.jsdelivr.net/gh/Waziio/Bot-LoL-Tracker@main/assets';

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
		role: SummonerRole | undefined,
		opggLink: string
	): EmbedBuilder | null {
		if (gameSummary.result === GameResult.REMAKE) return null;

		const gameDuration = this.formatGameDuration(duration);
		this.embedBuilder.setTitle(gameSummary.result);
		this.embedBuilder.addFields(
			{ name: 'Champion', value: this.translateChampionName(champion) },
			{ name: 'Score', value: score },
			{ name: 'Durée', value: gameDuration },
			{ name: 'Détails', value: `[**OPGG**](${opggLink})` }
		);
		this.embedBuilder.setThumbnail(`https://ddragon.leagueoflegends.com/cdn/15.2.1/img/champion/${champion}.png`);
		if (role) {
			const roleIconFile = `${this.getRoleIconFileName(role)}.png`;
			this.embedBuilder.setAuthor({ name: this.translateRoleName(role), iconURL: `${ROLE_ICON_BASE_URL}/${roleIconFile}` });
		}

		let message: EmbedBuilder | null;
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
				message = null;
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
					});
			}
		}
		this.embedBuilder.setDescription(this.summoner.getTotalRank()).setColor(gameResult == GameResult.VICTORY ? 'Green' : 'Red');
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
			description = `*Descente en **${this.summoner.getTier()}** *`;
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

	private getRoleIconFileName(role: SummonerRole): string {
		return role.toLowerCase();
	}

	private translateChampionName(champion : string) {
		if (champion && champion === "MonkeyKing") {
			return "Wukong";
		} else {
			return champion;
		}
	}

	private translateRoleName(role: SummonerRole) {
		switch (role) {
			case "MIDDLE":
				return "MID";
			case "BOTTOM":
				return "ADC";
			case "UTILITY":
				return "SUPPORT";
			default:
				return role;
		}
	}
}
