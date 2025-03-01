import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import express, { Request, Response } from "express";
import Summoner from "./src/classes/Summoner";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const channelId: string | any = process.env.CHANNEL_ID;
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates],
});
const token = process.env.BOT_TOKEN;
const port = 8000;

const summoners = [
  new Summoner("Mohamed", "Thv9OHEhk7foYhwnwIlZSKMs-TVXOOliR-XIncJ3rQkUOuX7", "330746797842759681"), // me
  new Summoner("Ewen", "jxxqj7MZXUeq1B3iJLHLNKfsW--x83dnkg5Q2IQA8ZdI2E5GZe97Iv9-OA", "410796897398423563"), // ewen
  new Summoner("Raphaël", "pjc66RDlPA8f0IpLsJVuxNvOYS9276AWba92sHJBU828TgU", "328484167119536128"), // raph
  new Summoner("Julien", "DFST_qORn2PSAjSPHHi35-zxqfiGaDnjVw4JJadiT8goEAmIJfeiv2Nc_g", "571030411346706446"), // julien
  new Summoner("Eliott", "l_0JwNv-TGcQGwSAvLZLEnyKFs7GRvw_V_Dz942jpKZJqWqi", "1041340632272228382"), // eliott
  new Summoner("Arthur", "LfijrIMWDlhbwAM7lNU-fcW_uOzZGm0_8JDNCABchHKsiJ9Dd7sd6ileNA", "548117430702964769"), // arthur
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

    // Ping its own endpoint to keep it active (and avoid sleeping mode of Koyeb...)
    axios.get(`http://localhost:${port}/health`).then(() => {
      console.log("Je requete /health pour éviter que koyeb m'arrête...")
    }).catch((erorr) => {
      console.log("Je n'ai pas réussi à appeler /health...")
      console.log(erorr)
    });

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

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).send("Bot is healthy");
});

app.listen(port, () => {
  console.log(`Serveur de contrôle de santé en cours d'exécution sur le port ${port}`);
});

client.login(token);
