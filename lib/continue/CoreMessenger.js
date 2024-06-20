import net from "net";
import { v4 as uuidv4 } from "uuid";

class CoreMessenger {
  constructor() {
    this.writer = null;
    this.reader = null;
    this.socket = null;

    this.generatorTypes = [
      "llm/streamComplete",
      "llm/streamChat",
      "command/run",
      "streamDiffLines",
    ];

    this.responseListeners = {};
    this.responseData = {};

    this.initTcpConnection();
  }

  initTcpConnection() {
    this.socket = net.createConnection(
      { host: "127.0.0.1", port: 3000 },
      () => {},
    );

    this.initDataHandler();
    this.initDisconnectionHandler();
    this.initErrorHandler();
  }

  initDataHandler() {
    this.socket.on("data", async (data) => {
      const lines = data
        .toString()
        .split("\r\n")
        .filter((line) => line.trim());
      for (const line of lines) {
        try {
          this.handleMessage(line);
        } catch (e) {
          console.error("Error handling message:", line);
          console.error(e);
        }
      }
    });
  }

  initDisconnectionHandler() {
    this.socket.on("end", () => {});
  }

  initErrorHandler() {
    this.socket.on("error", (err) => {
      console.error("Socket error:", err);
    });
  }

  write(message) {
    try {
      this.socket.write(message + "\r\n");
    } catch (e) {
      console.error("Error writing to socket:", e);
    }
  }

  request(messageType, data, messageId, onResponse = null) {
    const id = messageId || uuidv4();
    const message = JSON.stringify({
      messageId: id,
      messageType: messageType,
      data: data,
    });
    this.responseListeners[id] = onResponse;
    this.responseData[id] = "";
    this.write(message);
  }

  handleMessage(json) {
    const responseMap = JSON.parse(json);
    const { messageId, messageType, data } = responseMap;

    if (this.responseListeners[messageId]) {
      if (this.generatorTypes.includes(messageType)) {
        const done = data?.done;
        if (done) {
          this.responseListeners[messageId](this.responseData[messageId]);
          delete this.responseListeners[messageId];
          delete this.responseData[messageId];
        } else {
          this.responseData[messageId] =
            this.responseData[messageId] + data.content;
        }
      } else {
        this.responseListeners[messageId](data);
        delete this.responseListeners[messageId];
      }
    }
  }
}

export default CoreMessenger;
