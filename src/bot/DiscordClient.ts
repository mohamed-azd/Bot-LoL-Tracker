import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import Summoner from "../classes/Summoner";
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
            new Summoner("Raphaël", "_n9UFPKqgFAMpwW5kRz2pz-aEd_l8gSjNUXr90G2l_N_jYa3SDV5vh68ZkTQol8KLZNyTk3z30MBGQ", "328484167119536128"),
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
        const channel: TextChannel | any = this.client.channels.cache.get(env.CHANNEL_ID);

        setInterval(async () => {
            logger.info("Tracking ...");
            for (const summoner of this.summoners) {
                try {
                    const changes = await summoner.check();
                    if (changes) {
                        logger.info(`New rank : ${summoner.toString()}`);
                        channel.send({ embeds: [changes] });
                    }
                    // Delay between summoners
                    await new Promise(resolve => setTimeout(resolve, 1500));
                } catch (error) {
                    logger.error(`Tracking error of ${summoner.getName()}: ${error}`);
                }

            }
        }, trackingDelay);
    }
}