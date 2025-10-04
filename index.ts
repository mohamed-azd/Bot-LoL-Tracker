import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import express, { Request, Response } from "express";
import Summoner from "./src/classes/Summoner";
import dotenv from "dotenv";

dotenv.config();

const channelId: string | any = process.env.CHANNEL_ID;
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates],
});
const token = process.env.BOT_TOKEN;

const summoners = [
  new Summoner("Mohamed", "PxSQZ7gOVeQycFfGa8t753oxKn4DSShMZKa7YxFIl_tKm65KcEmDLI--xRCFWnaNrkHlctf9NJDIZw", "330746797842759681"),
  new Summoner("Ewen", "aFUPBcQKqVsDgzW_7KAhipehx1ooPD_5e_XUD0DXXwPncD9YEYPVaSsD5FMwROH2hiRfyLnXQnfUxQ", "410796897398423563"),
  new Summoner("Raphaël", "_n9UFPKqgFAMpwW5kRz2pz-aEd_l8gSjNUXr90G2l_N_jYa3SDV5vh68ZkTQol8KLZNyTk3z30MBGQ", "328484167119536128"),
  new Summoner("Julien", "mfm-fI3gn06ftEa-mLPhh9T3ChWbOiB5uFew1BGi8JDwyJr8S03aa7OKMhof40R9vub5E6HG6UMYww", "571030411346706446"),
  new Summoner("Eliott", "3DgYEwlHA_arPajBwrHcky7g9KdQwW30v21rFzs17ESPl-6XZ0sQ5RKhC-U513i7GTfnI_Kdr4iaRA", "1041340632272228382"),
  new Summoner("Arthur", "9HNoIqT-sFXgp7uXdZ7TSSIMotFyAbGhxrj3joddQXNJ4WWU4U-Pa5gufhBRM-Ou8i93uF-Yaxp4zg", "548117430702964769"),
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

client.on("messageCreate", async (message: any) => {
  const channel: TextChannel | any = client.channels.cache.get(channelId);

  if (message.content.toLowerCase().startsWith("!key ") && message.author.id === "330746797842759681") {
    const newKey = message.content.split(" ")[1].trim();
    process.env.RIOT_API_KEY = newKey;
    // checks that the key is updated
    if (process.env.RIOT_API_KEY === newKey) {
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
      // Delay between summoners
      await new Promise(resolve => setTimeout(resolve, 1500));
    });
  }, 180000);
}

const app = express();
const port = 8000; // Port de contrôle de santé

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).send("Bot is healthy");
});

app.listen(port, () => {
  console.log(`Serveur de contrôle de santé en cours d'exécution sur le port ${port}`);
});

client.login(token);
