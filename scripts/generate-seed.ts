import { writeFileSync } from "node:fs";
import { classifyItems } from "../src/services/liturgical-structure-service";
import { parseItemReferences } from "../src/services/scripture-reference-service";
import type { SourceItem } from "../src/types/scripture";
const sql = (value: unknown) =>
  `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
const statements = [
  `-- GENERATED synthetic local fixtures. Regenerate with npm run db:seed:generate.
-- Local-only account; never apply seed.sql to a hosted project.
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
  invited_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,
  recovery_token,email_change_token_new,email_change)
values('00000000-0000-0000-0000-000000000000','11111111-1111-4111-8111-111111111111',
  'authenticated','authenticated','elder@example.test',extensions.crypt('Local-elders-2026!',extensions.gen_salt('bf')),
  now(),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','');
insert into auth.identities(id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
values(gen_random_uuid(),'11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111',
  '{"sub":"11111111-1111-4111-8111-111111111111","email":"elder@example.test","email_verified":true}','email',now(),now(),now());
insert into public.sync_runs(id,started_by,status,kind,sync_start_date,sync_end_date)
values('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','running','sync','2024-01-01',current_date);`,
];
const dates = [
  "2024-01-07",
  "2025-09-07",
  "2026-08-09",
  "2026-08-23",
  "2026-08-30",
  "2026-09-06",
];
for (const [index, date] of dates.entries()) {
  const entries: [SourceItem["item_type"], string, string][] = [
    ["item", "Announcements", "Welcome to our synthetic example service."],
    ["header", "God calls his people to worship from all nations.", ""],
    ["item", "Call to Worship", index === 0 ? "Psalm 23" : "Psalm 95:1-7"],
    ["item", "Invocation", ""],
    ["song", "How Great (Psalm 145)", "Psalm 145"],
    ["header", "God convicts his people and cleanses them of their sin.", ""],
    [
      "item",
      "Confession of Sin",
      index % 2 ? "Based on Prov. 10:12" : "Based on Romans 3:23",
    ],
    ["item", "Assurance of Forgiveness", "Romans 5:1"],
    [
      "header",
      "God renews and sets his people apart by His Word and Spirit",
      "",
    ],
    [
      "item",
      "Scripture Reading",
      index === 4 ? "Romans 8:31–9:5" : "Ephesians 2:1-10",
    ],
    ["item", "Pastoral Prayer", "A prayer for our neighbors."],
    ["item", "Profession of Faith", "The Apostles' Creed"],
    [
      "item",
      "Sermon",
      index === 5
        ? '1 Peter 4:7-11 - "The End of All Things"'
        : "1 Peter 2:9-12",
    ],
    [
      "header",
      "God sends his people with his blessing to make disciples of all nations.",
      "",
    ],
    ["item", "Benediction", "Numbers 6:24-26"],
    ["song", "Doxology", "Psalm 100"],
  ];
  const items = classifyItems(
    entries.map(([item_type, title, description], sequence) => ({
      planning_center_id: `seed-item-${index}-${sequence}`,
      item_type,
      title,
      description,
      html_details: "",
      sequence,
      service_position: "during",
      planning_center_updated_at: null,
    })),
  )
    .filter((i) => i.item_type !== "song")
    .map((i) => ({ ...i, references: parseItemReferences(i) }));
  const serviceType = {
    planning_center_id: `seed-type-${index % 2}`,
    name: index % 2 ? "Sunday Evening" : "Sunday Morning",
  };
  const plan = {
    planning_center_id: `seed-plan-${index}`,
    title: `Example worship · ${date}`,
    service_date: date,
    planning_center_url: null,
  };
  statements.push(
    `select public.replace_plan('22222222-2222-4222-8222-222222222222',${sql(serviceType)},${sql(plan)},${sql(items)});`,
  );
}
statements.push(`update public.sync_runs set status='completed',completed_at=now(),service_types_processed=2,
plans_processed=6,items_processed=(select count(*) from public.planning_center_plan_items),
scripture_references_found=(select count(*) from public.scripture_references) where id='22222222-2222-4222-8222-222222222222';`);
writeFileSync("supabase/seed.sql", statements.join("\n\n") + "\n");
console.log("Generated six synthetic services and one local invited account.");
