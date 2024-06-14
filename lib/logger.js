import pino from "pino";
import path from "path";
import fs from "fs";
import { loadConfig } from "./config.js";

const config = loadConfig();
const LOG_DIRECTORY = path.resolve(
  process.env.HOME || process.env.USERPROFILE,
  ".commandai",
);

if (!fs.existsSync(LOG_DIRECTORY)) {
  fs.mkdirSync(LOG_DIRECTORY, { recursive: true });
}

class Logger {
  constructor(logName) {
    const logFilePath = path.join(LOG_DIRECTORY, `${logName}.log`);

    if (config?.enableLogging) {
      this.logger = pino({
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
      this.logger = pino({ level: "silent" });
    }
  }

  info(message) {
    this.logger.info(message);
  }

  error(message) {
    this.logger.error(message);
  }

  warn(message) {
    this.logger.warn(message);
  }

  debug(message) {
    this.logger.debug(message);
  }
}

export default Logger;
