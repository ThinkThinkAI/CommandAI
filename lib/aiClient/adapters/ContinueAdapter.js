import { continueChat } from "../../continue/continue.js";
import BaseAdapter from "./BaseAdapter.js";

class ContinueAdapter extends BaseAdapter {
  constructor(config) {
    super(config);

    this.model = config.continueModel;
  }

  handleMessage(json) {
    const { messageId, messageType, data } = JSON.parse(json);

    if (!this.responseListeners[messageId]) {
      return;
    }

    if (this.generatorTypes.includes(messageType)) {
      this.handleGeneratorType(messageId, data);
    } else {
      this.handleRegularType(messageId, data);
    }
  }

  handleGeneratorType(messageId, data) {
    const done = data?.done;
    if (done) {
      this.responseListeners[messageId](this.responseData[messageId]);
      this.cleanUp(messageId);
    } else {
      this.responseData[messageId] =
        (this.responseData[messageId] || "") + data.content;
    }
  }

  handleRegularType(messageId, data) {
    this.responseListeners[messageId](data);
    this.cleanUp(messageId);
  }

  cleanUp(messageId) {
    delete this.responseListeners[messageId];
    delete this.responseData[messageId];
  }
}

export default ContinueAdapter;
