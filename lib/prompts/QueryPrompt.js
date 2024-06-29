import Prompt from "./Prompt.js";
import os from "os";

class QueryPrompt extends Prompt {
  constructor(model_name, dbAdapter) {
    super("query", model_name);
    this.dbAdapter = dbAdapter;
  }

  async context() {
    let tableAndSchemasObj = await this.dbAdapter.getAllTablesAndSchemas();
    const tablesAndSchemas = JSON.stringify(tableAndSchemasObj);

    return {
      tablesAndSchemas: tablesAndSchemas,
    };
  }

  async out() {
    const context = await this.context();
    return await super.out(context);
  }
}

export default QueryPrompt;
