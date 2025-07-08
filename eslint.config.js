import globals from "globals";

export default [
  {
    ignores: [
      "public/dist/**",
      "dist/**",
      "coverage/**",
      "src/styles/tailwind.js",
      "node_modules/**",
    ],
  },
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double"],
      "no-unused-vars": ["warn"],
      "no-undef": ["error"],
    },
  },
];
