import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    extends: [
      "js/recommended",
      "@stylistic/recommended",
    ],
    plugins: {
      js,
      "@stylistic": stylistic,
    },
    languageOptions: { globals: globals.browser },
  },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  tseslint.configs.recommended,

  stylistic.configs.customize({
    // the following options are the default values
    indent: 2,
    quotes: "double",
    semi: true,
    arrowParens: true,
    // ...
  }),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": ["error", { allowInterfaces: "always" }],
      "@typescript-eslint/no-unused-vars": ["error", { args: "none" }],

      "@stylistic/indent": ["error", 2, {
        FunctionDeclaration: {parameters: "off"},
        CallExpression: {arguments: "off"},
        ignoredNodes: ["TSDeclareFunction", "TSParameterProperty"],
        SwitchCase: 1,
        MemberExpression: 0,
        flatTernaryExpressions: true,
        VariableDeclarator: 2,
        ArrayExpression: "first",
      }],
      "@stylistic/space-before-function-paren": ["error", {
        anonymous: "never", named: "never", catch: "always"
      }],

      "@stylistic/array-bracket-spacing": "off",
      "@stylistic/arrow-parens": "off",
      "@stylistic/brace-style": ["error", "1tbs", {allowSingleLine: true}],
      "@stylistic/comma-dangle": "off",
      "@stylistic/indent-binary-ops": "off",
      "@stylistic/lines-between-class-members": "off",
      "@stylistic/max-statements-per-line": ["error", { max: 2 }],
      "@stylistic/member-delimiter-style": "off",
      "@stylistic/multiline-ternary": "off",
      "@stylistic/no-extra-parens": "off",
      "@stylistic/no-multi-spaces": "off",
      "@stylistic/no-multiple-empty-lines": ["error", {max: 2}],
      "@stylistic/object-curly-spacing": "off",
      "@stylistic/operator-linebreak": ["error", "after"],
      "@stylistic/padded-blocks": "off",
      "@stylistic/quotes": "off",
      "@stylistic/semi": ["error", "always"],
      "@stylistic/space-infix-ops": ["error", {ignoreTypes: true}],
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
