import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      complexity: ["error", 5],
    },
  },
  pluginJs.configs.recommended,
];
