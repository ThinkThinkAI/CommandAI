import pino from "pino";
import path from "path";
import fs from "fs";
import { loadConfig } from "./config.js";

const config = loadConfig();
const LOG_DIRECTORY = path.resolve(
  process.env.HOME || process.env.USERPROFILE,
  ".commandai",
  "logs"
);
const logFilePath = path.join(
  LOG_DIRECTORY,
  `log_${new Date().toISOString().slice(0, 10)}.log`
);

let logger = null;

if (config?.enableLogging) {
  if (!fs.existsSync(LOG_DIRECTORY)) {
    fs.mkdirSync(LOG_DIRECTORY, { recursive: true });
  }

  logger = pino({
    level: "info",
    transport: {
      target: "pino-pretty",
      options: {
        destination: logFilePath,
        mkdir: true,
      },
    },
  });
} else {
  logger = pino({ level: "silent" }); // Silent logger
}

export default logger;
