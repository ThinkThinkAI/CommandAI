import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      complexity: ["error", 5],
      "max-lines-per-function": ["error", { max: 25 }],
    },
  },
  pluginJs.configs.recommended,
];
