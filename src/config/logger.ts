import pino from "pino";
import env from "./env";

const logger = pino({
    level: env.NODE_ENV === "production" ? "info" : "debug",
    transport:
        process.env.NODE_ENV !== "production"
            ? {
                target: "pino-pretty",
                options: { colorize: true, translateTime: "SYS:standard" },
            }
            : undefined,
});

export default logger;