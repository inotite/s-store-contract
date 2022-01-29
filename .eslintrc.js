module.exports = {
  env: {
    mocha: true,
    node: true,
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "standard",
    'plugin:@typescript-eslint/recommended',
    "plugin:prettier/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: './tsconfig.json',
    sourceType: 'module',
  },
  rules: {
    "node/no-unsupported-features/es-syntax": [
      "error",
      { ignores: ["modules"] },
    ],
    "prettier/prettier": [
      "error", 
      {
        endOfLine: "auto"
      }
    ]
  },
  ignorePatterns: ["**/*.js", "dist", "**/*.d.ts"],
};
