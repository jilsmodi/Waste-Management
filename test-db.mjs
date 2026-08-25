import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_g3BOr5wAVmba@ep-bold-shape-ayan9hju.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require");

async function verifyDatabase() {
  console.log("🔍 Checking Cloud Neon PostgreSQL Database Connection...\n");

  try {
    // 1. Connection check
    const [{ now }] = await sql`SELECT NOW()`;
    console.log(`✅ Cloud Database Connected! (Server Time: ${now})`);

    // 2. Count tables & records
    const users = await sql`SELECT count(*) as count FROM users`;
    const reports = await sql`SELECT count(*) as count FROM reports`;
    const rewards = await sql`SELECT count(*) as count FROM rewards`;
    const vehicles = await sql`SELECT count(*) as count FROM vehicles`;

    console.log("\n📊 Database Summary:");
    console.log(`   • Users:     ${users[0].count} accounts`);
    console.log(`   • Reports:   ${reports[0].count} waste reports`);
    console.log(`   • Rewards:   ${rewards[0].count} reward records`);
    console.log(`   • Vehicles:  ${vehicles[0].count} fleet vehicles`);

    // 3. Sample Demo Users
    const sampleUsers = await sql`SELECT id, name, email, role FROM users LIMIT 5`;
    console.log("\n👥 Sample Live Users in DB:");
    console.table(sampleUsers);

    console.log("🎉 Database is 100% ONLINE, HEALTHY, and READY FOR DEMO!\n");
  } catch (error) {
    console.error("❌ Database verification failed:", error);
  }
}

verifyDatabase();
