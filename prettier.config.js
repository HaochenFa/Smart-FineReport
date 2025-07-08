/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  // 让ESLint完全控制引号，Prettier不处理
  singleQuote: false, // 禁用，让ESLint处理
  quoteProps: "consistent", // 禁用，让ESLint处理

  // 与ESLint保持一致：使用分号
  semi: true,

  // 代码格式化设置
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,
  trailingComma: "es5",
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",

  // 针对不同文件类型的特殊配置
  overrides: [
    {
      files: "*.svelte",
      options: {
        parser: "svelte",
      },
    },
  ],
};

export default config;
