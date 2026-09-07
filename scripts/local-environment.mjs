import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
if (existsSync(".env.local"))
  throw Error(
    ".env.local already exists. Update it manually to preserve your configuration.",
  );
const status = JSON.parse(
  execFileSync(
    process.execPath,
    ["node_modules/supabase/dist/supabase.js", "status", "-o", "json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ),
);
if (!["localhost", "127.0.0.1"].includes(new URL(status.API_URL).hostname))
  throw Error("Expected local Supabase.");
writeFileSync(
  ".env.local",
  `SUPABASE_URL=${status.API_URL}\nSUPABASE_PUBLISHABLE_KEY=${status.PUBLISHABLE_KEY || status.ANON_KEY}\nSUPABASE_SECRET_KEY=${status.SECRET_KEY || status.SERVICE_ROLE_KEY}\n`,
);
console.log(
  "Wrote local Supabase settings to ignored .env.local without printing credentials.",
);
