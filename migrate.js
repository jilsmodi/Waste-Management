import { neon } from "@neondatabase/serverless";

const sql = neon("postgresql://zerotohero_owner:SPVe2rokvBf6@ep-bitter-shadow-a5lbwa60.us-east-2.aws.neon.tech/zerotohero?sslmode=require");

async function run() {
  try {
    await sql`
      ALTER TABLE "reports"
      ADD COLUMN IF NOT EXISTS "priority" varchar(20) DEFAULT 'low',
      ADD COLUMN IF NOT EXISTS "description" text,
      ADD COLUMN IF NOT EXISTS "landmark" text,
      ADD COLUMN IF NOT EXISTS "assigned_vehicle" varchar(255),
      ADD COLUMN IF NOT EXISTS "assigned_worker" integer REFERENCES "users"("id"),
      ADD COLUMN IF NOT EXISTS "resolved_at" timestamp,
      ADD COLUMN IF NOT EXISTS "before_image" text,
      ADD COLUMN IF NOT EXISTS "after_image" text,
      ADD COLUMN IF NOT EXISTS "citizen_verification" boolean DEFAULT false;
    `;
    console.log("Migration successful");
  } catch (err) {
    console.error(err);
  }
}
run();
