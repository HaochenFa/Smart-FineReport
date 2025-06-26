export default [
  {
    "files": ["src/**/*.js"],
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
