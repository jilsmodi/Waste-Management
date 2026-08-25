export default {
    dialect: "postgresql",
    schema: "./src/utils/db/schema.ts",
    out: "./drizzle",
    dbCredentials: {
      url: "postgresql://neondb_owner:npg_g3BOr5wAVmba@ep-bold-shape-ayan9hju.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require",
      connectionString:
        "postgresql://neondb_owner:npg_g3BOr5wAVmba@ep-bold-shape-ayan9hju.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require",
    },
  };
  