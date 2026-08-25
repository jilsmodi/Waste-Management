import { db } from './dbConfig';
import { Users, Reports, Rewards, CollectedWastes, Notifications, Transactions, Incidents, HotspotPredictions, Vehicles, Routes } from './schema';
import { eq, sql, and, desc, ne, gte, lte, count, avg } from 'drizzle-orm';

// ==================== USER & AUTH ACTIONS ====================

export async function createUser(
  email: string,
  name: string,
  role: string = 'citizen',
  password?: string,
  phone?: string,
  avatarUrl?: string
) {
  try {
    const existing = await getUserByEmail(email);
    if (existing) {
      const [updated] = await db
        .update(Users)
        .set({
          name: name || existing.name,
          role: role || existing.role || 'citizen',
          ...(password ? { password } : {}),
          ...(phone ? { phone } : {}),
          ...(avatarUrl ? { avatarUrl } : {}),
        })
        .where(eq(Users.email, email))
        .returning()
        .execute();
      return updated || existing;
    }

    const [user] = await db
      .insert(Users)
      .values({
        email,
        name,
        role: role || 'citizen',
        password: password || null,
        phone: phone || null,
        avatarUrl: avatarUrl || null,
      })
      .returning()
      .execute();
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const [user] = await db.select().from(Users).where(eq(Users.email, email)).execute();
    return user || null;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
}

export async function authenticateUser(email: string, password?: string) {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return { success: false, message: "User not found with this email" };
    }
    if (user.password && password && user.password !== password) {
      return { success: false, message: "Invalid password" };
    }
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'citizen',
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      }
    };
  } catch (error: any) {
    console.error("Authentication error:", error);
    return { success: false, message: error.message || "Authentication failed" };
  }
}

export async function getAllUsers(limit: number = 50) {
  try {
    return await db.select().from(Users).limit(limit).execute();
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function getPlatformStats() {
  try {
    const [reportsCount] = await db.select({ value: count() }).from(Reports);
    const [usersCount] = await db.select({ value: count() }).from(Users);
    const openReports = await db.select().from(Reports).where(ne(Reports.status, 'COMPLETED'));
    const allRewards = await db.select().from(Rewards);
    const totalPoints = allRewards.reduce((sum, r) => sum + (r.points || 0), 0);
    
    return {
      totalReports: reportsCount?.value || 0,
      totalUsers: usersCount?.value || 0,
      openTasks: openReports.length,
      totalPoints,
      wasteCollectedKg: Math.round(((reportsCount?.value || 0) * 14.2) * 10) / 10,
      co2OffsetKg: Math.round(((reportsCount?.value || 0) * 7.1) * 10) / 10,
    };
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    return {
      totalReports: 24,
      totalUsers: 14,
      openTasks: 5,
      totalPoints: 12450,
      wasteCollectedKg: 340.8,
      co2OffsetKg: 170.4,
    };
  }
}

// ==================== INCIDENT ACTIONS ====================

export async function createIncident(
  location: string,
  latitude: string | null,
  longitude: string | null,
  wasteType: string,
  severity: string,
  healthRisk: string,
  estimatedVolume: string
) {
  try {
    const [incident] = await db
      .insert(Incidents)
      .values({
        location,
        latitude,
        longitude,
        wasteType,
        severity,
        healthRisk,
        estimatedVolume,
        reportCount: 1,
        priorityScore: 0,
        status: "open",
      })
      .returning()
      .execute();
    return incident;
  } catch (error) {
    console.error("Error creating incident:", error);
    return null;
  }
}

export async function incrementIncidentReportCount(incidentId: number) {
  try {
    const [updated] = await db
      .update(Incidents)
      .set({
        reportCount: sql`${Incidents.reportCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(Incidents.id, incidentId))
      .returning()
      .execute();
    return updated;
  } catch (error) {
    console.error("Error incrementing incident report count:", error);
    return null;
  }
}

export async function updateIncidentPriority(incidentId: number, priorityScore: number) {
  try {
    const [updated] = await db
      .update(Incidents)
      .set({
        priorityScore,
        updatedAt: new Date(),
      })
      .where(eq(Incidents.id, incidentId))
      .returning()
      .execute();
    return updated;
  } catch (error) {
    console.error("Error updating incident priority:", error);
    return null;
  }
}

export async function getOpenIncidents() {
  try {
    return await db
      .select()
      .from(Incidents)
      .where(eq(Incidents.status, "open"))
      .orderBy(desc(Incidents.priorityScore))
      .execute();
  } catch (error) {
    console.error("Error fetching open incidents:", error);
    return [];
  }
}

export async function getIncidentsByLocation(latitude: string, longitude: string, radiusKm: number = 0.5) {
  try {
    // Simple bounding box check (approx. 0.5km ≈ 0.0045 degrees)
    const degreeOffset = radiusKm * 0.009;
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    const incidents = await db
      .select()
      .from(Incidents)
      .where(
        and(
          eq(Incidents.status, "open"),
          sql`CAST(${Incidents.latitude} AS DOUBLE PRECISION) BETWEEN ${latNum - degreeOffset} AND ${latNum + degreeOffset}`,
          sql`CAST(${Incidents.longitude} AS DOUBLE PRECISION) BETWEEN ${lngNum - degreeOffset} AND ${lngNum + degreeOffset}`
        )
      )
      .execute();

    return incidents;
  } catch (error) {
    console.error("Error fetching incidents by location:", error);
    return [];
  }
}

export async function updateIncidentStatus(incidentId: number, status: string) {
  try {
    const updateData: any = { status, updatedAt: new Date() };
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }
    const [updated] = await db
      .update(Incidents)
      .set(updateData)
      .where(eq(Incidents.id, incidentId))
      .returning()
      .execute();
    return updated;
  } catch (error) {
    console.error("Error updating incident status:", error);
    return null;
  }
}

export async function getAllIncidents(limit: number = 50) {
  try {
    return await db
      .select()
      .from(Incidents)
      .orderBy(desc(Incidents.priorityScore))
      .limit(limit)
      .execute();
  } catch (error) {
    console.error("Error fetching all incidents:", error);
    return [];
  }
}

// ==================== REPORT ACTIONS (Enhanced) ====================

export async function createReport(
  userId: number,
  location: string,
  wasteType: string,
  amount: string,
  imageUrl?: string,
  verificationResult?: any,
  latitude?: string,
  longitude?: string,
  severity?: string,
  priority?: string,
  healthRisk?: string,
  confidence?: number,
  wasteCategories?: any,
  recyclableMaterials?: any,
  recyclableValue?: string,
  recommendation?: string,
  incidentId?: number,
  description?: string,
  landmark?: string
) {
  try {
    const [report] = await db
      .insert(Reports)
      .values({
        userId,
        location,
        wasteType,
        amount,
        imageUrl,
        verificationResult,
        status: "SUBMITTED",
        latitude: latitude || null,
        longitude: longitude || null,
        severity: severity || "medium",
        priority: priority || "low",
        healthRisk: healthRisk || "low",
        confidence: confidence || 0,
        wasteCategories: wasteCategories || null,
        recyclableMaterials: recyclableMaterials || null,
        recyclableValue: recyclableValue || null,
        recommendation: recommendation || null,
        incidentId: incidentId || null,
        description: description || null,
        landmark: landmark || null,
      })
      .returning()
      .execute();

    // Award 10 points for reporting waste
    const pointsEarned = 10;
    await updateRewardPoints(userId, pointsEarned);

    // Create a transaction for the earned points
    await createTransaction(userId, 'earned_report', pointsEarned, 'Points earned for reporting waste');

    // Create a notification for the user
    await createNotification(
      userId,
      `You've earned ${pointsEarned} points for reporting waste!`,
      'reward'
    );

    return report;
  } catch (error) {
    console.error("Error creating report:", error);
    return null;
  }
}

export async function getReportsByUserId(userId: number) {
  try {
    const reports = await db.select().from(Reports).where(eq(Reports.userId, userId)).execute();
    return reports;
  } catch (error) {
    console.error("Error fetching reports:", error);
    return [];
  }
}

export async function getRecentReports(limit: number = 10) {
  try {
    const reports = await db
      .select()
      .from(Reports)
      .orderBy(desc(Reports.createdAt))
      .limit(limit)
      .execute();
    return reports;
  } catch (error) {
    console.error("Error fetching recent reports:", error);
    return [];
  }
}

export async function getReportsForArea(latitude: string, longitude: string, radiusKm: number = 1) {
  try {
    const degreeOffset = radiusKm * 0.009;
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    return await db
      .select()
      .from(Reports)
      .where(
        and(
          sql`CAST(${Reports.latitude} AS DOUBLE PRECISION) BETWEEN ${latNum - degreeOffset} AND ${latNum + degreeOffset}`,
          sql`CAST(${Reports.longitude} AS DOUBLE PRECISION) BETWEEN ${lngNum - degreeOffset} AND ${lngNum + degreeOffset}`
        )
      )
      .orderBy(desc(Reports.createdAt))
      .execute();
  } catch (error) {
    console.error("Error fetching reports for area:", error);
    return [];
  }
}

export async function getPendingReports() {
  try {
    return await db.select().from(Reports).where(eq(Reports.status, "pending")).execute();
  } catch (error) {
    console.error("Error fetching pending reports:", error);
    return [];
  }
}

export async function updateReportStatus(reportId: number, status: string) {
  try {
    const [updatedReport] = await db
      .update(Reports)
      .set({ status })
      .where(eq(Reports.id, reportId))
      .returning()
      .execute();
    return updatedReport;
  } catch (error) {
    console.error("Error updating report status:", error);
    return null;
  }
}

// ==================== HOTSPOT PREDICTION ACTIONS ====================

export async function createHotspotPrediction(
  location: string,
  latitude: string | null,
  longitude: string | null,
  predictedDate: Date,
  probability: number,
  expectedIncrease: number,
  recommendedVehicles: number,
  factors: any
) {
  try {
    const [prediction] = await db
      .insert(HotspotPredictions)
      .values({
        location,
        latitude,
        longitude,
        predictedDate,
        probability,
        expectedIncrease,
        recommendedVehicles,
        factors,
        status: "predicted",
      })
      .returning()
      .execute();
    return prediction;
  } catch (error) {
    console.error("Error creating hotspot prediction:", error);
    return null;
  }
}

export async function getActiveHotspotPredictions() {
  try {
    return await db
      .select()
      .from(HotspotPredictions)
      .where(
        and(
          eq(HotspotPredictions.status, "predicted"),
          gte(HotspotPredictions.predictedDate, new Date())
        )
      )
      .orderBy(desc(HotspotPredictions.probability))
      .execute();
  } catch (error) {
    console.error("Error fetching active hotspot predictions:", error);
    return [];
  }
}

export async function getAllHotspotPredictions(limit: number = 20) {
  try {
    return await db
      .select()
      .from(HotspotPredictions)
      .orderBy(desc(HotspotPredictions.createdAt))
      .limit(limit)
      .execute();
  } catch (error) {
    console.error("Error fetching hotspot predictions:", error);
    return [];
  }
}

// ==================== WASTE COLLECTION TASK ACTIONS ====================

export async function getWasteCollectionTasks(limit: number = 20) {
  try {
    const tasks = await db
      .select({
        id: Reports.id,
        location: Reports.location,
        wasteType: Reports.wasteType,
        amount: Reports.amount,
        status: Reports.status,
        date: Reports.createdAt,
        collectorId: Reports.collectorId,
        severity: Reports.severity,
        latitude: Reports.latitude,
        longitude: Reports.longitude,
        reporterName: Users.name,
      })
      .from(Reports)
      .leftJoin(Users, eq(Reports.userId, Users.id))
      .limit(limit)
      .execute();

    return tasks.map(task => ({
      ...task,
      date: task.date.toISOString().split('T')[0],
      reporterName: task.reporterName || "Anonymous Citizen",
    }));
  } catch (error) {
    console.error("Error fetching waste collection tasks:", error);
    return [];
  }
}

export async function updateTaskStatus(reportId: number, newStatus: string, collectorId?: number) {
  try {
    const updateData: any = { status: newStatus };
    if (collectorId !== undefined) {
      updateData.collectorId = collectorId;
    }
    const [updatedReport] = await db
      .update(Reports)
      .set(updateData)
      .where(eq(Reports.id, reportId))
      .returning()
      .execute();
    return updatedReport;
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
}

// ==================== REWARD ACTIONS ====================

export async function getOrCreateReward(userId: number) {
  try {
    let [reward] = await db.select().from(Rewards).where(eq(Rewards.userId, userId)).execute();
    if (!reward) {
      [reward] = await db.insert(Rewards).values({
        userId,
        name: 'Default Reward',
        collectionInfo: 'Default Collection Info',
        points: 0,
        level: 1,
        isAvailable: true,
      }).returning().execute();
    }
    return reward;
  } catch (error) {
    console.error("Error getting or creating reward:", error);
    return null;
  }
}

export async function updateRewardPoints(userId: number, pointsToAdd: number) {
  try {
    // Ensure user has a reward record first
    await getOrCreateReward(userId);

    const [updatedReward] = await db
      .update(Rewards)
      .set({ 
        points: sql`${Rewards.points} + ${pointsToAdd}`,
        updatedAt: new Date()
      })
      .where(eq(Rewards.userId, userId))
      .returning()
      .execute();
    return updatedReward;
  } catch (error) {
    console.error("Error updating reward points:", error);
    return null;
  }
}

export async function saveReward(userId: number, amount: number) {
  try {
    const updatedReward = await updateRewardPoints(userId, amount);
    
    await createTransaction(userId, 'earned_collect', amount, 'Points earned for collecting waste');
    return updatedReward;
  } catch (error) {
    console.error("Error saving reward:", error);
    throw error;
  }
}

export async function getAllRewards() {
  try {
    const rewards = await db
      .select({
        id: Rewards.id,
        userId: Rewards.userId,
        points: Rewards.points,
        level: Rewards.level,
        createdAt: Rewards.createdAt,
        userName: Users.name,
      })
      .from(Rewards)
      .leftJoin(Users, eq(Rewards.userId, Users.id))
      .orderBy(desc(Rewards.points))
      .execute();

    return rewards;
  } catch (error) {
    console.error("Error fetching all rewards:", error);
    return [];
  }
}

export async function getAvailableRewards(userId: number) {
  try {
    const userTransactions = await getRewardTransactions(userId);
    const userPoints = userTransactions.reduce((total, transaction) => {
      return transaction.type.startsWith('earned') ? total + transaction.amount : total - transaction.amount;
    }, 0);

    const dbRewards = await db
      .select({
        id: Rewards.id,
        name: Rewards.name,
        cost: Rewards.points,
        description: Rewards.description,
        collectionInfo: Rewards.collectionInfo,
      })
      .from(Rewards)
      .where(eq(Rewards.isAvailable, true))
      .execute();

    const allRewards = [
      {
        id: 0,
        name: "Your Points",
        cost: userPoints,
        description: "Redeem your earned points",
        collectionInfo: "Points earned from reporting and collecting waste"
      },
      ...dbRewards
    ];

    return allRewards;
  } catch (error) {
    console.error("Error fetching available rewards:", error);
    return [];
  }
}

export async function redeemReward(userId: number, rewardId: number) {
  try {
    const userReward = await getOrCreateReward(userId) as any;
    
    if (rewardId === 0) {
      const [updatedReward] = await db.update(Rewards)
        .set({ 
          points: 0,
          updatedAt: new Date(),
        })
        .where(eq(Rewards.userId, userId))
        .returning()
        .execute();

      await createTransaction(userId, 'redeemed', userReward.points, `Redeemed all points: ${userReward.points}`);
      return updatedReward;
    } else {
      const availableReward = await db.select().from(Rewards).where(eq(Rewards.id, rewardId)).execute();

      if (!userReward || !availableReward[0] || userReward.points < availableReward[0].points) {
        throw new Error("Insufficient points or invalid reward");
      }

      const [updatedReward] = await db.update(Rewards)
        .set({ 
          points: sql`${Rewards.points} - ${availableReward[0].points}`,
          updatedAt: new Date(),
        })
        .where(eq(Rewards.userId, userId))
        .returning()
        .execute();

      await createTransaction(userId, 'redeemed', availableReward[0].points, `Redeemed: ${availableReward[0].name}`);
      return updatedReward;
    }
  } catch (error) {
    console.error("Error redeeming reward:", error);
    throw error;
  }
}

// ==================== COLLECTED WASTE ACTIONS ====================

export async function createCollectedWaste(reportId: number, collectorId: number, notes?: string) {
  try {
    const [collectedWaste] = await db
      .insert(CollectedWastes)
      .values({
        reportId,
        collectorId,
        collectionDate: new Date(),
      })
      .returning()
      .execute();
    return collectedWaste;
  } catch (error) {
    console.error("Error creating collected waste:", error);
    return null;
  }
}

export async function saveCollectedWaste(reportId: number, collectorId: number, verificationResult: any) {
  try {
    const [collectedWaste] = await db
      .insert(CollectedWastes)
      .values({
        reportId,
        collectorId,
        collectionDate: new Date(),
        status: 'verified',
      })
      .returning()
      .execute();
    return collectedWaste;
  } catch (error) {
    console.error("Error saving collected waste:", error);
    throw error;
  }
}

export async function getCollectedWastesByCollector(collectorId: number) {
  try {
    return await db.select().from(CollectedWastes).where(eq(CollectedWastes.collectorId, collectorId)).execute();
  } catch (error) {
    console.error("Error fetching collected wastes:", error);
    return [];
  }
}

// ==================== NOTIFICATION ACTIONS ====================

export async function createNotification(userId: number, message: string, type: string) {
  try {
    const [notification] = await db
      .insert(Notifications)
      .values({ userId, message, type })
      .returning()
      .execute();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

export async function getUnreadNotifications(userId: number) {
  try {
    return await db.select().from(Notifications).where(
      and(
        eq(Notifications.userId, userId),
        eq(Notifications.isRead, false)
      )
    ).execute();
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: number) {
  try {
    await db.update(Notifications).set({ isRead: true }).where(eq(Notifications.id, notificationId)).execute();
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

// ==================== TRANSACTION ACTIONS ====================

export async function createTransaction(userId: number, type: 'earned_report' | 'earned_collect' | 'redeemed', amount: number, description: string) {
  try {
    const [transaction] = await db
      .insert(Transactions)
      .values({ userId, type, amount, description })
      .returning()
      .execute();
    return transaction;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
}

export async function getRewardTransactions(userId: number) {
  try {
    const transactions = await db
      .select({
        id: Transactions.id,
        type: Transactions.type,
        amount: Transactions.amount,
        description: Transactions.description,
        date: Transactions.date,
      })
      .from(Transactions)
      .where(eq(Transactions.userId, userId))
      .orderBy(desc(Transactions.date))
      .limit(10)
      .execute();

    const formattedTransactions = transactions.map(t => ({
      ...t,
      date: t.date.toISOString().split('T')[0],
    }));

    return formattedTransactions;
  } catch (error) {
    console.error("Error fetching reward transactions:", error);
    return [];
  }
}

export async function getUserBalance(userId: number): Promise<number> {
  try {
    const reward = await getOrCreateReward(userId);
    return reward ? reward.points : 0;
  } catch (error) {
    console.error("Error fetching user balance:", error);
    return 0;
  }
}

// ==================== DASHBOARD ANALYTICS ====================

export async function getDashboardStats() {
  try {
    const [reportStats] = await db
      .select({
        total: count(),
        pending: sql<number>`COUNT(CASE WHEN ${Reports.status} = 'pending' THEN 1 END)`,
        inProgress: sql<number>`COUNT(CASE WHEN ${Reports.status} = 'in_progress' THEN 1 END)`,
        verified: sql<number>`COUNT(CASE WHEN ${Reports.status} = 'verified' THEN 1 END)`,
      })
      .from(Reports)
      .execute();

    const [incidentStats] = await db
      .select({
        total: count(),
        open: sql<number>`COUNT(CASE WHEN ${Incidents.status} = 'open' THEN 1 END)`,
        resolved: sql<number>`COUNT(CASE WHEN ${Incidents.status} = 'resolved' THEN 1 END)`,
        avgPriority: sql<number>`COALESCE(AVG(${Incidents.priorityScore}), 0)`,
      })
      .from(Incidents)
      .execute();

    return {
      reports: reportStats,
      incidents: incidentStats,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      reports: { total: 0, pending: 0, inProgress: 0, verified: 0 },
      incidents: { total: 0, open: 0, resolved: 0, avgPriority: 0 },
    };
  }
}

export async function getWasteTypeDistribution() {
  try {
    const distribution = await db
      .select({
        wasteType: Reports.wasteType,
        count: count(),
      })
      .from(Reports)
      .groupBy(Reports.wasteType)
      .orderBy(desc(count()))
      .limit(10)
      .execute();
    return distribution;
  } catch (error) {
    console.error("Error fetching waste type distribution:", error);
    return [];
  }
}

export async function getReportsPerDay(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const reports = await db
      .select({
        date: sql<string>`DATE(${Reports.createdAt})`,
        count: count(),
      })
      .from(Reports)
      .where(gte(Reports.createdAt, startDate))
      .groupBy(sql`DATE(${Reports.createdAt})`)
      .orderBy(sql`DATE(${Reports.createdAt})`)
      .execute();
    return reports;
  } catch (error) {
    console.error("Error fetching reports per day:", error);
    return [];
  }
}

// ==================== FLEET MANAGEMENT ====================

export async function getVehicles() {
  try {
    return await db.select().from(Vehicles).execute();
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return [];
  }
}

export async function updateVehicleLocation(vehicleId: number, lat: string, lng: string) {
  try {
    const [updated] = await db.update(Vehicles)
      .set({ latitude: lat, longitude: lng, lastUpdated: new Date() })
      .where(eq(Vehicles.id, vehicleId))
      .returning()
      .execute();
    return updated;
  } catch (error) {
    console.error("Error updating vehicle location:", error);
    return null;
  }
}

export async function getActiveRoutes() {
  try {
    return await db.select().from(Routes).where(eq(Routes.status, 'active')).execute();
  } catch (error) {
    console.error("Error fetching routes:", error);
    return [];
  }
}
