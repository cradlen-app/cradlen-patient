import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Architecture boundary rules — see `CLAUDE.md` § "Architecture: Modular
 * Kernel + Plugin Layout" for the full rationale.
 *
 * Public surface rule: `core/<name>` and `plugins/<name>` may only be
 * imported via their barrel (the path ending at the module name) or via
 * `api`, `manifest`, `index`, or `messages` subpaths. Deep imports into
 * `components/`, `hooks/`, `lib/`, etc. are blocked.
 *
 * Kernel internal rule: `@/kernel/registry` and `@/kernel/host` are
 * implementation; only the kernel itself reaches them. External code
 * imports via the `@/kernel` barrel.
 *
 * Transitional: `src/features/**` (the sunset layer) is allowed to import
 * from anywhere. Likewise `core/<name>` may still depend on
 * `@/features/<feature>` while features wait their turn to migrate.
 */
const moduleBoundaryRules = {
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: [
            "@/core/*/components/**",
            "@/core/*/hooks/**",
            "@/core/*/lib/**",
            "@/core/*/types/**",
            "@/core/*/data/**",
            "@/core/*/permissions",
            "@/core/*/queryKeys",
            "@/core/*/nav",
          ],
          message:
            "Import only from a core module's public surface: '@/core/<name>', '@/core/<name>/api', '@/core/<name>/manifest', or '@/core/<name>/messages/*'.",
        },
        {
          group: [
            "@/plugins/*/components/**",
            "@/plugins/*/hooks/**",
            "@/plugins/*/lib/**",
            "@/plugins/*/listeners/**",
          ],
          message:
            "Import only from a plugin's public surface: '@/plugins/<name>', '@/plugins/<name>/api', or '@/plugins/<name>/manifest'.",
        },
        {
          group: ["@/kernel/registry/**", "@/kernel/host/**", "@/kernel/events/**"],
          message: "Import kernel internals only via the '@/kernel' barrel.",
        },
      ],
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // Apply the boundary rules to all TS/TSX source files...
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: moduleBoundaryRules,
  },
  {
    // ...except inside a module's own folder, where deep imports are normal,
    // and inside the kernel itself, which obviously consumes its internals.
    files: [
      "src/core/*/**",
      "src/plugins/*/**",
      "src/kernel/**",
    ],
    rules: { "no-restricted-imports": "off" },
  },
]);

export default eslintConfig;
