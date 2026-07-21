import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Independently-built clients and operational/generated fixtures have
    // their own toolchains and must not weaken the web application's gate.
    "BeautyHQ-iOS/**",
    "beautyhq-mobile/**",
    "beautyhq_flutter/**",
    "iphoneupload/**",
    "prisma/seed*.ts",
    "scripts/**",
  ]),
  {
    // The inherited UI contains broad typing and presentation debt. Keep it
    // visible in CI while reserving failures for parse/type/build/test issues.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "prefer-const": "warn",
    },
  },
]);

export default eslintConfig;
