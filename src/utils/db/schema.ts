import { integer, varchar, pgTable, serial, text, timestamp, jsonb, boolean, real } from "drizzle-orm/pg-core";

// Users table
export const Users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("citizen"),
  password: text("password"),
  phone: varchar("phone", { length: 50 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Incidents table — groups duplicate reports into a single incident
export const Incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  location: text("location").notNull(),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  reportCount: integer("report_count").notNull().default(1),
  priorityScore: integer("priority_score").notNull().default(0),
  severity: varchar("severity", { length: 20 }).notNull().default("medium"),
  status: varchar("status", { length: 50 }).notNull().default("open"),
  wasteType: varchar("waste_type", { length: 255 }),
  estimatedVolume: varchar("estimated_volume", { length: 255 }),
  healthRisk: varchar("health_risk", { length: 20 }).default("low"),
  locationSensitivity: varchar("location_sensitivity", { length: 20 }).default("medium"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

// Reports table — Enhanced with AI severity, categories, and incident linkage
export const Reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  location: text("location").notNull(),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  wasteType: varchar("waste_type", { length: 255 }).notNull(),
  amount: varchar("amount", { length: 255 }).notNull(),
  imageUrl: text("image_url"),
  verificationResult: jsonb("verification_result"),
  status: varchar("status", { length: 255 }).notNull().default("SUBMITTED"),
  severity: varchar("severity", { length: 20 }).default("medium"), // low, medium, high, critical
  priority: varchar("priority", { length: 20 }).default("low"), // low, medium, high, critical
  healthRisk: varchar("health_risk", { length: 20 }).default("low"),
  description: text("description"),
  landmark: text("landmark"),
  confidence: real("confidence").default(0), // Change to real for float 0-1 values
  wasteCategories: jsonb("waste_categories"),
  recyclableMaterials: jsonb("recyclable_materials"),
  recyclableValue: varchar("recyclable_value", { length: 100 }),
  recommendation: text("recommendation"),
  incidentId: integer("incident_id").references(() => Incidents.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  collectorId: integer("collector_id").references(() => Users.id),
  assignedVehicle: varchar("assigned_vehicle", { length: 255 }),
  assignedWorker: integer("assigned_worker").references(() => Users.id),
  resolvedAt: timestamp("resolved_at"),
  beforeImage: text("before_image"),
  afterImage: text("after_image"),
  citizenVerification: boolean("citizen_verification").default(false),
});

// Hotspot predictions table
export const HotspotPredictions = pgTable("hotspot_predictions", {
  id: serial("id").primaryKey(),
  location: text("location").notNull(),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  predictedDate: timestamp("predicted_date").notNull(),
  probability: integer("probability").notNull(),
  expectedIncrease: integer("expected_increase"),
  recommendedVehicles: integer("recommended_vehicles").default(1),
  factors: jsonb("factors"),
  status: varchar("status", { length: 20 }).default("predicted"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Rewards table
export const Rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  points: integer("points").notNull().default(0),
  level: integer("level").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  description: text("description"),
  name: varchar("name", { length: 255 }).notNull(),
  collectionInfo: text("collection_info").notNull(),
});

// CollectedWastes table
export const CollectedWastes = pgTable("collected_wastes", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").references(() => Reports.id).notNull(),
  collectorId: integer("collector_id").references(() => Users.id).notNull(),
  collectionDate: timestamp("collection_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("collected"),
});

// Notifications table
export const Notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Transactions table
export const Transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'earned' or 'redeemed'
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

// Vehicles table
export const Vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  vehicleNumber: varchar("vehicle_number", { length: 50 }).notNull().unique(),
  driverId: integer("driver_id").references(() => Users.id),
  status: varchar("status", { length: 20 }).notNull().default("AVAILABLE"), // AVAILABLE, ON_ROUTE, COLLECTING, FULL, EMERGENCY, OFFLINE
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  speed: real("speed").default(0),
  capacity: real("capacity").notNull(), // e.g., 5.0 (tons)
  currentLoad: real("current_load").default(0),
  currentRouteId: integer("current_route_id"), // Reference to Routes added later
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Routes table
export const Routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => Vehicles.id).notNull(),
  collectionPoints: jsonb("collection_points").notNull(), // Array of point objects
  totalDistance: real("total_distance").notNull(),
  estimatedTime: integer("estimated_time").notNull(), // in minutes
  estimatedFuel: real("estimated_fuel").notNull(), // in liters
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, completed, recalculated
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// GPSTracking table
export const GPSTracking = pgTable("gps_tracking", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => Vehicles.id).notNull(),
  latitude: varchar("latitude", { length: 50 }).notNull(),
  longitude: varchar("longitude", { length: 50 }).notNull(),
  speed: real("speed").default(0),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});