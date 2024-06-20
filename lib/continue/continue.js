import CoreMessenger from "./CoreMessenger.js";
import net from "net";
import { v4 as uuidv4 } from "uuid";

async function coreRequest(messageType, data = null) {
  const coreMessenger = new CoreMessenger();

  return new Promise((resolve, reject) => {
    const messageId = uuidv4();
    coreMessenger.request(messageType, data, messageId, (response) => {
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
}

async function getBrowserSerialized() {
  return await coreRequest("config/getBrowserSerialized");
}

async function continueActive() {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);

    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });

    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(3000, "127.0.0.1");
  });
}

async function getContinueModels() {
  const config = await getBrowserSerialized();
  if (config?.models?.length) {
    return config.models.map((model) => model.title);
  }
  return []; // Return an empty array if there are no models
}

async function continueChat(data) {
  return await coreRequest("llm/streamChat", data);
}

export {
  coreRequest,
  getBrowserSerialized,
  continueActive,
  getContinueModels,
  continueChat,
};
