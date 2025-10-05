import express, { Request, Response } from "express";
import DiscordClient from "./src/bot/DiscordClient";
import logger from "./src/config/logger";

const app = express();
const port = 8000;

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).send("Bot is healthy");
});

app.listen(port, () => {
  logger.info(`Server is OK on ${port}`);
});

const bot = new DiscordClient();
bot.init().catch((err: Error) => {
  logger.error(`Error on Discord bot initialization : ${err.message}`)
});
