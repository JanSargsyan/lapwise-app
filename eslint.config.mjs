import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig, globalIgnores } from "eslint/config";


export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ["src/**/*", "app/**/*", "components/**/*", "constants/**/*"],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['./*', '../*', './**', '../**'],
              message: 'Use absolute imports (e.g., src/foo/bar) instead of relative imports.',
            },
          ],
        },
      ],
    },
  },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  globalIgnores([
    "node_modules/",
    "lib/",
    ".yarn/",
    "packages/",
    "eslint.config.mjs",
  ]),
]);
