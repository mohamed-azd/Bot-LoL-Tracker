import { Client, GatewayIntentBits, TextChannel, EmbedBuilder } from "discord.js";
import express, { Request, Response } from "express";
import Summoner from "./classes/entity/Summoner";
import dotenv from "dotenv";

dotenv.config();

const channelId: string | any = process.env.CHANNEL_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates],
});

const token = process.env.BOT_TOKEN;

const summoners = [
  new Summoner("LIwa2IKSBetnQxAEFSbzsh3C8ZTde1OQVUCnTiGvYHCrv7n4", "330746797842759681"),
  new Summoner("9TZ578OHnzvp7MVcOpLy5jdlPRkA_LfcSCShqqUxhRQ3Emri", "410796897398423563"),
  new Summoner("wQ6YjvwEKGjwzny59N0kyMC8CuCmieaJI4oYSO3cGoAZnOM", "328484167119536128"),
  new Summoner("6csEdijM-R2gfQ0sWaym6t0Qu0g6_aINt33zB-lqvYyQaB068j3IJ6_joQ", "571030411346706446"),
];

client.once("ready", async () => {
  try {
    console.log("Bot lancé");
    summoners.forEach(async (summoner) => {
      await summoner.loadData();
      console.log(`Summoner ${summoner.getName()} initialisé !`);
    });
    await track(summoners);
  } catch (err: any) {
    console.log(err);
  }
});

client.on("messageCreate", async (message) => {
  const channel: TextChannel | any = client.channels.cache.get(channelId);
  if (message.content.toLowerCase().includes("samuel") && !message.author.bot) {
    message.reply("https://tenor.com/view/samuel-funny-dog-smile-happy-gif-17384183");
  }

  if (message.content.toLowerCase().startsWith("!key ") && message.author.id === "330746797842759681") {
    const newKey = message.content.split(" ")[1].trim();
    process.env.RIOT_API_KEY = newKey;
    // checks that the key is updated
    if(process.env.RIOT_API_KEY === newKey) {
      message.reply("Clé Riot mise à jour !")
      await client.destroy()
    }
  }
});

async function track(summoners: Summoner[]) {
  const channel: TextChannel | any = client.channels.cache.get(channelId);
  setInterval(async () => {
    console.log("Tracking ...");
    summoners.forEach(async (summoner) => {
      const changes = await summoner.check();
      console.log(changes);
      if (changes) channel.send({ embeds: [changes] });
    });
  }, 60000);
}

const app = express();
const port = 8000; // Port de contrôle de santé

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  if (client.isReady()) {
    res.status(200).send("Bot is healthy");
  } else {
    res.status(500).send("Bot is not healthy");
  }
});

app.listen(port, () => {
  console.log(`Serveur de contrôle de santé en cours d'exécution sur le port ${port}`);
});

client.login(token);
