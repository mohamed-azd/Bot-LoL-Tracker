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

const summoners = [new Summoner("Waziio"), new Summoner("MY ZED GOT U"), new Summoner("Bald Chicken"), new Summoner("ElBrocolito")];

client.on("ready", async () => {
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

client.on("messageCreate", (message) => {
  const channel: TextChannel | any = client.channels.cache.get(channelId);
  if (message.content.toLowerCase().includes("samuel") && !message.author.bot) {
    message.reply("https://tenor.com/view/samuel-funny-dog-smile-happy-gif-17384183");
  }

  if (message.content.toLowerCase().includes("test")) {
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
  }, 10000);
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
