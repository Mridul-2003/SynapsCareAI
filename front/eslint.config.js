import js from "@eslint/js";
import next from "eslint-config-next";

export default [
  js.configs.recommended,
  ...next,
  {
    languageOptions: {
      globals: {
        React: "readonly", // React warnings band
        NodeJS: "readonly", // NodeJS warnings band
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "no-unused-vars": "warn",
      "no-undef": "warn",
      "react-hooks/purity": "off",
      "react/no-unescaped-entities": "off",
      "import/no-anonymous-default-export": "off", // eslint.config.js warning band
    },
  },
];
