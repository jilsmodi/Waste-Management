import { neon } from '@neondatabase/serverless';

const DB_URL = "postgresql://neondb_owner:npg_g3BOr5wAVmba@ep-bold-shape-ayan9hju.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DB_URL);

async function seed() {
  console.log("🌱 Starting RootX Demo Seeding...");

  try {
    // 1. Ensure Columns exist on users table
    await sql`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "role" varchar(50) DEFAULT 'citizen',
      ADD COLUMN IF NOT EXISTS "password" text,
      ADD COLUMN IF NOT EXISTS "phone" varchar(50),
      ADD COLUMN IF NOT EXISTS "avatar_url" text;
    `;
    console.log("✓ Verified/Updated users table schema");

    // 2. Ensure columns on reports table
    await sql`
      ALTER TABLE "reports"
      ADD COLUMN IF NOT EXISTS "latitude" varchar(50),
      ADD COLUMN IF NOT EXISTS "longitude" varchar(50),
      ADD COLUMN IF NOT EXISTS "severity" varchar(20) DEFAULT 'medium',
      ADD COLUMN IF NOT EXISTS "priority" varchar(20) DEFAULT 'low',
      ADD COLUMN IF NOT EXISTS "health_risk" varchar(20) DEFAULT 'low',
      ADD COLUMN IF NOT EXISTS "confidence" real DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "waste_categories" jsonb,
      ADD COLUMN IF NOT EXISTS "recyclable_materials" jsonb,
      ADD COLUMN IF NOT EXISTS "recyclable_value" varchar(100),
      ADD COLUMN IF NOT EXISTS "recommendation" text,
      ADD COLUMN IF NOT EXISTS "incident_id" integer,
      ADD COLUMN IF NOT EXISTS "collector_id" integer,
      ADD COLUMN IF NOT EXISTS "assigned_vehicle" varchar(255),
      ADD COLUMN IF NOT EXISTS "assigned_worker" integer,
      ADD COLUMN IF NOT EXISTS "resolved_at" timestamp,
      ADD COLUMN IF NOT EXISTS "before_image" text,
      ADD COLUMN IF NOT EXISTS "after_image" text,
      ADD COLUMN IF NOT EXISTS "citizen_verification" boolean DEFAULT false;
    `;
    console.log("✓ Verified/Updated reports table schema");

    // 3. Seed Demo Users
    const demoUsers = [
      { email: 'citizen.demo@rootx.eco', name: 'Aarav Sharma', role: 'citizen', phone: '+91 98251 12345' },
      { email: 'employee.demo@rootx.eco', name: 'Rajesh Patel', role: 'employee', phone: '+91 98252 23456' },
      { email: 'admin.demo@rootx.eco', name: 'Dr. Anita Desai', role: 'admin', phone: '+91 98253 34567' },
      { email: 'ngop41274@gmail.com', name: 'Priya Mehta', role: 'citizen', phone: '+91 98254 45678' },
      { email: 'phuct5042@gmail.com', name: 'Vihaan Patel', role: 'employee', phone: '+91 98255 56789' },
      { email: 'thienphuc123@gmail.com', name: 'Aditya Rao', role: 'citizen', phone: '+91 98256 67890' },
      { email: 'sdey35664@gmail.com', name: 'Subham Dey', role: 'employee', phone: '+91 98257 78901' },
      { email: 'neha.shah@rootx.eco', name: 'Neha Shah', role: 'citizen', phone: '+91 98258 89012' },
      { email: 'karan.verma@rootx.eco', name: 'Karan Verma', role: 'citizen', phone: '+91 98259 90123' },
      { email: 'pooja.joshi@rootx.eco', name: 'Pooja Joshi', role: 'citizen', phone: '+91 98250 01234' },
      { email: 'manoj.kumar@rootx.eco', name: 'Manoj Kumar', role: 'citizen', phone: '+91 98241 11223' },
      { email: 'rohit.deshmukh@rootx.eco', name: 'Rohit Deshmukh', role: 'citizen', phone: '+91 98242 22334' },
      { email: 'ananya.iyer@rootx.eco', name: 'Ananya Iyer', role: 'citizen', phone: '+91 98243 33445' },
      { email: 'vikram.singh@rootx.eco', name: 'Vikram Singh', role: 'employee', phone: '+91 98244 44556' },
    ];

    for (const u of demoUsers) {
      await sql`
        INSERT INTO "users" (email, name, role, phone, password)
        VALUES (${u.email}, ${u.name}, ${u.role}, ${u.phone}, 'demo123')
        ON CONFLICT (email) DO UPDATE 
        SET name = EXCLUDED.name, role = EXCLUDED.role, phone = EXCLUDED.phone;
      `;
    }
    console.log(`✓ Seeded/Updated ${demoUsers.length} Users`);

    // Fetch user IDs
    const usersInDb = await sql`SELECT id, email FROM users`;
    const userMap = {};
    usersInDb.forEach(u => { userMap[u.email] = u.id; });
    const citizenId = userMap['citizen.demo@rootx.eco'] || usersInDb[0].id;
    const employeeId = userMap['employee.demo@rootx.eco'] || usersInDb[1]?.id || citizenId;

    // 4. Seed Rewards and Leaderboard
    const leaderboardSeed = [
      { email: 'citizen.demo@rootx.eco', points: 650, level: 3 },
      { email: 'ngop41274@gmail.com', points: 520, level: 3 },
      { email: 'thienphuc123@gmail.com', points: 410, level: 2 },
      { email: 'neha.shah@rootx.eco', points: 380, level: 2 },
      { email: 'karan.verma@rootx.eco', points: 290, level: 2 },
      { email: 'pooja.joshi@rootx.eco', points: 220, level: 1 },
      { email: 'manoj.kumar@rootx.eco', points: 180, level: 1 },
      { email: 'rohit.deshmukh@rootx.eco', points: 120, level: 1 },
      { email: 'ananya.iyer@rootx.eco', points: 90, level: 1 },
    ];

    for (const lb of leaderboardSeed) {
      const uId = userMap[lb.email];
      if (uId) {
        const existing = await sql`SELECT id FROM rewards WHERE user_id = ${uId} LIMIT 1`;
        if (existing.length === 0) {
          await sql`
            INSERT INTO rewards (user_id, points, level, name, collection_info, is_available)
            VALUES (${uId}, ${lb.points}, ${lb.level}, 'Eco Hero Badge', 'Earned from community cleanups', true);
          `;
        } else {
          await sql`
            UPDATE rewards 
            SET points = ${lb.points}, level = ${lb.level} 
            WHERE user_id = ${uId};
          `;
        }
      }
    }
    console.log("✓ Seeded Rewards and Leaderboard points");

    // 5. Seed Reports & Tasks
    const sampleReports = [
      {
        location: "Sector 21 Market Area, Gandhinagar",
        latitude: "23.2382",
        longitude: "72.6510",
        wasteType: "Plastic & Packaging Waste",
        amount: "15 kg",
        severity: "high",
        priority: "high",
        healthRisk: "medium",
        status: "SUBMITTED",
        description: "Overflowing plastic bottle container and packaging near fruit stalls",
      },
      {
        location: "InfoCity IT Park Gate 2, Gandhinagar",
        latitude: "23.1882",
        longitude: "72.6280",
        wasteType: "E-Waste & Cardboard",
        amount: "28 kg",
        severity: "critical",
        priority: "critical",
        healthRisk: "high",
        status: "IN_PROGRESS",
        description: "Electronic scrap and discarded computer packing materials",
      },
      {
        location: "Sector 11 Shopping Center, Gandhinagar",
        latitude: "23.2200",
        longitude: "72.6550",
        wasteType: "Organic Food Waste",
        amount: "40 kg",
        severity: "medium",
        priority: "medium",
        healthRisk: "medium",
        status: "SUBMITTED",
        description: "Food waste pile near restaurant lane",
      },
      {
        location: "Sector 7 Bus Terminal, Gandhinagar",
        latitude: "23.2160",
        longitude: "72.6370",
        wasteType: "Mixed Municipal Waste",
        amount: "35 kg",
        severity: "high",
        priority: "high",
        healthRisk: "medium",
        status: "SUBMITTED",
        description: "Large pile accumulated near bus parking corner",
      },
      {
        location: "Sector 16 Community Garden, Gandhinagar",
        latitude: "23.2300",
        longitude: "72.6400",
        wasteType: "Dry Leaf & Garden Trimmings",
        amount: "22 kg",
        severity: "low",
        priority: "low",
        healthRisk: "low",
        status: "COMPLETED",
        description: "Garden cuttings and dry branches collected successfully",
      },
      {
        location: "Sector 22 Residential Block B, Gandhinagar",
        latitude: "23.2350",
        longitude: "72.6480",
        wasteType: "Glass Bottles & Metals",
        amount: "18 kg",
        severity: "medium",
        priority: "medium",
        healthRisk: "medium",
        status: "SUBMITTED",
        description: "Discarded beverage bottles and metal cans near recycling bin",
      },
      {
        location: "Sector 28 Industrial Zone, Gandhinagar",
        latitude: "23.2450",
        longitude: "72.6600",
        wasteType: "Industrial Packaging & Pallets",
        amount: "65 kg",
        severity: "high",
        priority: "high",
        healthRisk: "low",
        status: "IN_PROGRESS",
        description: "Heavy wooden pallets and corrugated sheets",
      },
      {
        location: "Sector 2 Civil Hospital Perimeter, Gandhinagar",
        latitude: "23.2000",
        longitude: "72.6600",
        wasteType: "General Sanitized Waste",
        amount: "12 kg",
        severity: "critical",
        priority: "critical",
        healthRisk: "high",
        status: "COMPLETED",
        description: "General waste around perimeter safely disposed",
      },
      {
        location: "Sector 26 Park Entrance, Gandhinagar",
        latitude: "23.2400",
        longitude: "72.6580",
        wasteType: "Single-Use Plastic Bags",
        amount: "8 kg",
        severity: "medium",
        priority: "low",
        healthRisk: "low",
        status: "SUBMITTED",
        description: "Plastic bags and cups scattered on walking track",
      },
      {
        location: "Sector 24 Vegetable Market, Gandhinagar",
        latitude: "23.2320",
        longitude: "72.6420",
        wasteType: "Decomposable Vegetable Waste",
        amount: "50 kg",
        severity: "high",
        priority: "high",
        healthRisk: "medium",
        status: "SUBMITTED",
        description: "End of day market vegetable residue requiring collection",
      }
    ];

    const currentReports = await sql`SELECT count(*) FROM reports`;
    if (parseInt(currentReports[0].count, 10) < 8) {
      for (const rep of sampleReports) {
        await sql`
          INSERT INTO reports (
            user_id, location, latitude, longitude, waste_type, amount,
            severity, priority, health_risk, status, description, confidence
          ) VALUES (
            ${citizenId}, ${rep.location}, ${rep.latitude}, ${rep.longitude},
            ${rep.wasteType}, ${rep.amount}, ${rep.severity}, ${rep.priority},
            ${rep.healthRisk}, ${rep.status}, ${rep.description}, 0.94
          );
        `;
      }
      console.log(`✓ Seeded ${sampleReports.length} Reports`);
    } else {
      console.log(`✓ Already have ${currentReports[0].count} reports in DB`);
    }

    // 6. Seed Vehicles
    const vehiclesSeed = [
      { number: 'GJ-18-AB-4521', driverId: employeeId, status: 'COLLECTING', lat: '23.2200', lng: '72.6400', speed: 32, cap: 5.0, load: 3.8 },
      { number: 'GJ-18-CD-2842', driverId: employeeId, status: 'AVAILABLE', lat: '23.2350', lng: '72.6300', speed: 0, cap: 5.0, load: 0.6 },
      { number: 'GJ-01-XY-7812', driverId: employeeId, status: 'ON_ROUTE', lat: '23.2450', lng: '72.6600', speed: 25, cap: 5.0, load: 2.2 },
      { number: 'GJ-18-EF-5678', driverId: employeeId, status: 'FULL', lat: '23.2100', lng: '72.6500', speed: 40, cap: 5.0, load: 4.7 }
    ];

    for (const v of vehiclesSeed) {
      await sql`
        INSERT INTO vehicles (vehicle_number, driver_id, status, latitude, longitude, speed, capacity, current_load)
        VALUES (${v.number}, ${v.driverId}, ${v.status}, ${v.lat}, ${v.lng}, ${v.speed}, ${v.cap}, ${v.load})
        ON CONFLICT (vehicle_number) DO UPDATE
        SET status = EXCLUDED.status, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
            speed = EXCLUDED.speed, current_load = EXCLUDED.current_load;
      `;
    }
    console.log("✓ Seeded Vehicles fleet");

    console.log("🎉 Database seeding completed successfully!");
  } catch (err) {
    console.error("❌ Seeding error:", err);
  }
}

seed();
