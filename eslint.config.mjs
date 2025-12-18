import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  tseslint.configs.recommended,

	{
		rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": ["error", {allowInterfaces: "always"}],
      "@typescript-eslint/no-unused-vars": ["error", {args: "none"}],
		},
  },

  {
    files: ["test/**/*.{js,jsx,ts,tsx,cjs,mjs}"],
    languageOptions: { globals: globals.node },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
