import { neon } from "@neondatabase/serverless";
const sql = neon("postgresql://zerotohero_owner:SPVe2rokvBf6@ep-bitter-shadow-a5lbwa60.us-east-2.aws.neon.tech/zerotohero?sslmode=require");
async function run() {
  try {
    const res = await sql`
      INSERT INTO "reports" ("user_id", "location", "waste_type", "amount", "status", "latitude", "longitude", "severity", "priority", "health_risk", "confidence", "description", "landmark")
      VALUES (1, 'Selected Location (23.2385, 72.6396)', 'Mixed Plastic', '4.8 kg', 'SUBMITTED', '23.2385', '72.6396', 'medium', 'medium', 'low', 0, 'desc', 'sector 24')
      RETURNING *;
    `;
    console.log("Success:", res);
  } catch (err) {
    console.error("DB Error:", err);
  }
}
run();
