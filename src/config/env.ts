import dotenv from "dotenv";

dotenv.config();

export default {
    CHANNEL_ID : process.env.CHANNEL_ID as string,
    BOT_TOKEN : process.env.BOT_TOKEN as string,
    RIOT_API_KEY : process.env.RIOT_API_KEY as string,
    NODE_ENV : process.env.NODE_ENV as string,
}