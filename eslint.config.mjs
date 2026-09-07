import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const layerPatterns = (layers) =>
  layers.flatMap((layer) => [
    `@/${layer}`,
    `@/${layer}/**`,
    `**/${layer}`,
    `**/${layer}/**`,
  ]);

const restrict = (layers, providers = false) => [
  "error",
  {
    patterns: [
      {
        group: [
          ...layerPatterns(layers),
          ...(providers ? ["@supabase/*"] : []),
        ],
        message:
          "This import crosses an architectural boundary. See docs/architecture/dependency-rules.md.",
      },
    ],
  },
];

const noServerActions = {
  selector: "ExpressionStatement[directive='use server']",
  message:
    "Use Route Handlers for application API operations, not Server Actions.",
};

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    "out/**",
    "coverage/**",
    "next-env.d.ts",
    "test-results/**",
    "playwright-report/**",
    "supabase/.temp/**",
  ]),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", noServerActions],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrict(["repositories", "lib"], true),
    },
  },
  {
    files: ["src/services/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrict(["app"], true),
    },
  },
  {
    files: ["src/repositories/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrict(["app", "services"], true),
    },
  },
  {
    files: ["src/lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrict(["app", "services", "repositories"]),
    },
  },
  {
    files: ["src/{schema,types,utils}/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrict(
        ["app", "services", "repositories", "lib"],
        true,
      ),
    },
  },
  {
    files: ["src/{services,repositories,lib}/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        noServerActions,
        {
          selector:
            "Program:not(:has(ImportDeclaration[source.value='server-only']))",
          message:
            "Server implementation modules must import 'server-only'. Put shared pure logic in schema/types/utils.",
        },
        {
          selector: "JSXElement, JSXFragment",
          message: "Server implementation layers must not contain UI.",
        },
      ],
    },
  },
]);
