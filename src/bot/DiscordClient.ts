import { Client, GatewayIntentBits, TextChannel, Events, Message } from "discord.js";
import Summoner from "../classes/Summoner";
import LeaderboardBuilder from "../classes/LeaderboardBuilder";
import logger from "../config/logger";
import env from "../config/env";

export default class DiscordClient {
    private client: Client;
    private readonly summoners: Summoner[];

    constructor() {
        this.client = new Client({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates],
        });
        this.summoners = [
            new Summoner("Mohamed", "PxSQZ7gOVeQycFfGa8t753oxKn4DSShMZKa7YxFIl_tKm65KcEmDLI--xRCFWnaNrkHlctf9NJDIZw", "330746797842759681"),
            new Summoner("Ewen", "aFUPBcQKqVsDgzW_7KAhipehx1ooPD_5e_XUD0DXXwPncD9YEYPVaSsD5FMwROH2hiRfyLnXQnfUxQ", "410796897398423563"),
            new Summoner("Raphaël", "fad2kjMznb-9AJIUBbeMmsB1KAo4tWboK6VlcHxiM8-ybzRtE_iGecj7-1OTj4RC-_PcvM4Z1uPAug", "328484167119536128"),
            new Summoner("Julien", "mfm-fI3gn06ftEa-mLPhh9T3ChWbOiB5uFew1BGi8JDwyJr8S03aa7OKMhof40R9vub5E6HG6UMYww", "571030411346706446"),
            new Summoner("Eliott", "3DgYEwlHA_arPajBwrHcky7g9KdQwW30v21rFzs17ESPl-6XZ0sQ5RKhC-U513i7GTfnI_Kdr4iaRA", "1041340632272228382"),
            new Summoner("Arthur", "9HNoIqT-sFXgp7uXdZ7TSSIMotFyAbGhxrj3joddQXNJ4WWU4U-Pa5gufhBRM-Ou8i93uF-Yaxp4zg", "548117430702964769"),
        ];
        this.start();
    }

    async init() {
        logger.info("Discord bot is starting...");
        await this.client.login(env.BOT_TOKEN);
    }

    private start() {
        this.client.once("ready", async () => {
            logger.info("Discord bot is ready");
            await this.initSummoners();
            this.startTracking();
        });

        this.client.on(Events.MessageCreate, async (message: Message) => {
            if (message.author.bot) return;
            if (message.content === "!classement") {
                await this.handleLeaderboard(message);
            }
            if (message.content === "!looser") {
                await this.handleLooser(message);
            }
        });
    }

    private async handleLeaderboard(message: Message) {
        try {
            const embed = LeaderboardBuilder.build(this.summoners);
            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            logger.error(`Error handling leaderboard: ${error}`);
        }
    }

    private async handleLooser(message: Message) {
        try {
            await message.channel.send("https://tenor.com/view/sleeping-homer-sleeping-simpson-sleeping-nerd-geek-gif-13933454307168757106");
        } catch (error) {
            logger.error(`Error handling looser: ${error}`);
        }
    }

    private async initSummoners() {
        for (const summoner of this.summoners) {
            try {
                await summoner.loadData();
                logger.info(`Summoner ${summoner.toString()} initialized`);
            } catch (error) {
                logger.error(`Init error of ${summoner.getName()}: ${error}`);
            }
        }
    }

    private startTracking() {
        const trackingDelay = 180_000;

        const track = async () => {
            try {
                logger.info("Tracking ...");
                const channel = this.client.channels.cache.get(env.CHANNEL_ID) as TextChannel;

                for (const summoner of this.summoners) {
                    try {
                        const changes = await summoner.check();
                        if (changes) {
                            logger.info(`New rank : ${summoner.toString()}`);
                            if (channel) {
                                await channel.send({ embeds: [changes] });
                            }
                        }
                        // Delay between summoners
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    } catch (error) {
                        logger.error(`Tracking error of ${summoner.getName()}: ${error}`);
                    }
                }
            } catch (error) {
                logger.error(`Global tracking error : ${error}`);
            }

            setTimeout(track, trackingDelay);
        };

        track();
    }
}