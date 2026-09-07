import { readdirSync, readFileSync, writeFileSync } from "node:fs";
const migrations = readdirSync("supabase/migrations")
  .filter((p) => p.endsWith(".sql"))
  .sort();
const sections = migrations.map(
  (name) =>
    `## ${name}\n\nSource: [migration](../../supabase/migrations/${name})\n\n\`\`\`sql\n${readFileSync("supabase/migrations/" + name, "utf8").trim()}\n\`\`\`\n`,
);
writeFileSync(
  "docs/generated/database-schema.md",
  "# Database schema reference\n\n> GENERATED from versioned migrations by `npm run db:docs`. Do not edit manually.\n\nThis is a mechanically synchronized SQL reference, not a second schema authority.\nApply migrations in the order shown; local seed data is excluded.\n\n" +
    sections.join("\n"),
);
