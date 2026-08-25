import { neon } from "@neondatabase/serverless";
const sql = neon("postgresql://zerotohero_owner:SPVe2rokvBf6@ep-bitter-shadow-a5lbwa60.us-east-2.aws.neon.tech/zerotohero?sslmode=require");
async function run() {
  try {
    await sql`
      ALTER TABLE "reports"
      ADD COLUMN IF NOT EXISTS "latitude" varchar(50),
      ADD COLUMN IF NOT EXISTS "longitude" varchar(50),
      ADD COLUMN IF NOT EXISTS "severity" varchar(20) DEFAULT 'medium',
      ADD COLUMN IF NOT EXISTS "health_risk" varchar(20) DEFAULT 'low',
      ADD COLUMN IF NOT EXISTS "confidence" real DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "waste_categories" jsonb,
      ADD COLUMN IF NOT EXISTS "recyclable_materials" jsonb,
      ADD COLUMN IF NOT EXISTS "recyclable_value" varchar(100),
      ADD COLUMN IF NOT EXISTS "recommendation" text,
      ADD COLUMN IF NOT EXISTS "incident_id" integer;
    `;
    console.log("Missing columns added.");
  } catch (err) {
    console.error(err);
  }
}
run();
