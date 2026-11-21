import parser from "@typescript-eslint/parser";
import n8nNodesBase from "eslint-plugin-n8n-nodes-base";

/** n8n's own lint rules encode conventions the compiler cannot see: display-name casing,
 *  option ordering, description punctuation, and the naming rules the Creator Portal
 *  checks on submission. */
export default [
  // Only sources are linted. Compiled output next to the sources would be linted
  // without the n8n plugin config and fail on rules it cannot resolve.
  { ignores: ["dist/**", "**/*.js", "**/*.d.ts"] },
  {
    files: ["credentials/**/*.ts"],
    languageOptions: { parser, parserOptions: { ecmaVersion: 2021, sourceType: "module" } },
    plugins: { "n8n-nodes-base": n8nNodesBase },
    rules: { ...n8nNodesBase.configs.credentials.rules }
  },
  {
    files: ["nodes/**/*.ts"],
    languageOptions: { parser, parserOptions: { ecmaVersion: 2021, sourceType: "module" } },
    plugins: { "n8n-nodes-base": n8nNodesBase },
    rules: { ...n8nNodesBase.configs.nodes.rules }
  }
];
