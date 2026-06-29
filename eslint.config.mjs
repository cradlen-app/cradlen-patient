import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Module boundary rule for the patient-portal feature.
 *
 * External code must import it through its public surface — the barrel
 * (`@/features/patient-portal`), the route-mounted UI (`/pages`), `/api`,
 * `/manifest`, or `/messages/*` — never reach into `components/`, `hooks/`,
 * `lib/`, `data/`, `types/`, `store/`, `queryKeys`, or `permissions` directly.
 * The module's own files are exempt (see the override below). `features/auth`
 * is intentionally not covered: it has no barrel yet and is consumed by deep
 * import; add one before extending this rule to it.
 */
const moduleBoundaryRules = {
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: [
            "@/features/patient-portal/components/**",
            "@/features/patient-portal/hooks/**",
            "@/features/patient-portal/lib/**",
            "@/features/patient-portal/data/**",
            "@/features/patient-portal/types/**",
            "@/features/patient-portal/store/**",
            "@/features/patient-portal/queryKeys",
            "@/features/patient-portal/permissions",
          ],
          message:
            "Import only from the patient-portal public surface: '@/features/patient-portal', '@/features/patient-portal/pages', '@/features/patient-portal/api', '@/features/patient-portal/manifest', or '@/features/patient-portal/messages/*'.",
        },
      ],
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: moduleBoundaryRules,
  },
  {
    // The module consumes its own internals freely.
    files: ["src/features/patient-portal/**"],
    rules: { "no-restricted-imports": "off" },
  },
]);

export default eslintConfig;
