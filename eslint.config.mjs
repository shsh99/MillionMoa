import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  js.configs.recommended,
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off"
    }
  },
  { ignores: [".next/**", "node_modules/**", "coverage/**"] }
];

export default eslintConfig;
