import { EmbedBuilder } from "discord.js";
import Summoner from "./Summoner";

export default class LeaderboardBuilder {
    static build(summoners: Summoner[]): EmbedBuilder {
        const sortedSummoners = [...summoners].sort((a, b) => b.getGlobalScore() - a.getGlobalScore());

        const embed = new EmbedBuilder()
            .setTitle(":trophy: Classement SoloQ")
            .setColor("Gold")
            .setTimestamp();

        // Ligne invisible pour forcer la largeur de l'embed
        let description = "\u200b\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\u2003\n";
        
        sortedSummoners.forEach((summoner, index) => {
            let prefix = "";
            switch (index) {
                case 0: prefix = ":first_place:"; break;
                case 1: prefix = ":second_place:"; break;
                case 2: prefix = ":third_place:"; break;
                default: prefix = `**${index + 1}.**`; break;
            }

            if (summoner.getTier() === "UNRANKED") {
                 description += `${prefix} ${summoner.getDiscordAt()}\n\u2003 *${summoner.getTier()}*\n\n`;
            } else {
                 description += `${prefix} ${summoner.getDiscordAt()}\n\u2003 *${summoner.getTier()} ${summoner.getRank()}* **${summoner.getLp()} LP** (${summoner.getNbWins() + summoner.getNbLosses()} games)\n\n`;
            }
        });

        description += "\u200b\n";
        embed.setDescription(description);
        return embed;
    }
}
