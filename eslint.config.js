export default [
  {
    "files": ["src/**/*.js"],
    "ignores": ["dist/**"],
    "languageOptions": {
      "ecmaVersion": "latest",
      "sourceType": "module",
      "globals": {
        "browser": true,
        "node": true
      }
    },
    "rules": {
      "semi": ["error", "always"],
      "quotes": ["error", "double"]
    }
  }
];