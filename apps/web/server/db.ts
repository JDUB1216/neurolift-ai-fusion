import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  aides,
  avatarProgress,
  avatars,
  burnoutAssessments,
  coachingActions,
  fusionResults,
  metrics,
  taskResults,
  trainingSessions,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ---------------------------------------------------------------------------
// Avatars
// ---------------------------------------------------------------------------
export async function getAvatars(ownerId?: number, isAdmin = false) {
  const db = await getDb();
  if (!db) return [];
  if (isAdmin) return db.select().from(avatars).orderBy(desc(avatars.createdAt));
  if (ownerId) return db.select().from(avatars).where(eq(avatars.ownerId, ownerId)).orderBy(desc(avatars.createdAt));
  return db.select().from(avatars).orderBy(desc(avatars.createdAt));
}

export async function getAvatarById(avatarId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(avatars).where(eq(avatars.avatarId, avatarId)).limit(1);
  return result[0] ?? null;
}

export async function createAvatar(data: {
  avatarId: string;
  traitName: string;
  traitDescription?: string;
  ownerId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(avatars).values(data);
  return getAvatarById(data.avatarId);
}

export async function getAvatarProgress(avatarId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(avatarProgress).where(eq(avatarProgress.avatarId, avatarId));
}

// ---------------------------------------------------------------------------
// Aides
// ---------------------------------------------------------------------------
export async function getAides(ownerId?: number, isAdmin = false) {
  const db = await getDb();
  if (!db) return [];
  if (isAdmin) return db.select().from(aides).orderBy(desc(aides.createdAt));
  if (ownerId) return db.select().from(aides).where(eq(aides.ownerId, ownerId)).orderBy(desc(aides.createdAt));
  return db.select().from(aides).orderBy(desc(aides.createdAt));
}

export async function getAideById(aideId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(aides).where(eq(aides.aideId, aideId)).limit(1);
  return result[0] ?? null;
}

export async function createAide(data: {
  aideId: string;
  name: string;
  expertiseArea?: string;
  coachingStrategies?: string;
  ownerId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(aides).values(data);
  return getAideById(data.aideId);
}

// ---------------------------------------------------------------------------
// Training Sessions
// ---------------------------------------------------------------------------
export async function getTrainingSessions(ownerId?: number, isAdmin = false) {
  const db = await getDb();
  if (!db) return [];
  if (isAdmin) return db.select().from(trainingSessions).orderBy(desc(trainingSessions.createdAt));
  if (ownerId) return db.select().from(trainingSessions).where(eq(trainingSessions.ownerId, ownerId)).orderBy(desc(trainingSessions.createdAt));
  return db.select().from(trainingSessions).orderBy(desc(trainingSessions.createdAt));
}

export async function getSessionById(sessionId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(trainingSessions).where(eq(trainingSessions.sessionId, sessionId)).limit(1);
  return result[0] ?? null;
}

export async function createSession(data: {
  sessionId: string;
  avatarId: string;
  aideId: string;
  scenarioId?: string;
  scenarioName?: string;
  ownerId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(trainingSessions).values({ ...data, status: "active" });
  return getSessionById(data.sessionId);
}

export async function endSession(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const session = await getSessionById(sessionId);
  if (!session) throw new Error("Session not found");
  const durationSeconds = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000);
  await db
    .update(trainingSessions)
    .set({ status: "completed", endTime: new Date(), durationSeconds })
    .where(eq(trainingSessions.sessionId, sessionId));
  return getSessionById(sessionId);
}

export async function updateSessionStatus(sessionId: string, status: "active" | "completed" | "failed" | "paused") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(trainingSessions).set({ status }).where(eq(trainingSessions.sessionId, sessionId));
  return getSessionById(sessionId);
}

// ---------------------------------------------------------------------------
// Task Results
// ---------------------------------------------------------------------------
export async function getTaskResults(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(taskResults).where(eq(taskResults.sessionId, sessionId)).orderBy(taskResults.createdAt);
}

// ---------------------------------------------------------------------------
// Coaching Actions
// ---------------------------------------------------------------------------
export async function getCoachingActions(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(coachingActions).where(eq(coachingActions.sessionId, sessionId)).orderBy(coachingActions.createdAt);
}

// ---------------------------------------------------------------------------
// Burnout Assessments
// ---------------------------------------------------------------------------
export async function getBurnoutAssessments(avatarId?: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  if (avatarId) {
    return db
      .select()
      .from(burnoutAssessments)
      .where(eq(burnoutAssessments.avatarId, avatarId))
      .orderBy(desc(burnoutAssessments.createdAt))
      .limit(limit);
  }
  return db.select().from(burnoutAssessments).orderBy(desc(burnoutAssessments.createdAt)).limit(limit);
}

export async function getLatestBurnoutPerAvatar() {
  const db = await getDb();
  if (!db) return [];
  // Get the latest assessment per avatar using a subquery approach
  return db
    .select()
    .from(burnoutAssessments)
    .orderBy(desc(burnoutAssessments.createdAt))
    .limit(100);
}

// ---------------------------------------------------------------------------
// Metrics / Analytics
// ---------------------------------------------------------------------------
export async function getMetrics(avatarId?: string, metricType?: string, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (avatarId) conditions.push(eq(metrics.avatarId, avatarId));
  if (metricType) conditions.push(eq(metrics.metricType, metricType));
  const query = db.select().from(metrics).orderBy(metrics.recordedAt).limit(limit);
  if (conditions.length > 0) {
    return db.select().from(metrics).where(and(...conditions)).orderBy(metrics.recordedAt).limit(limit);
  }
  return query;
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { activeSessions: 0, totalAvatars: 0, totalAides: 0, highBurnoutCount: 0, fusionReadyCount: 0 };

  const [activeSessionsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(trainingSessions)
    .where(eq(trainingSessions.status, "active"));

  const [totalAvatarsResult] = await db.select({ count: sql<number>`count(*)` }).from(avatars);
  const [totalAidesResult] = await db.select({ count: sql<number>`count(*)` }).from(aides);

  const [highBurnoutResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(avatars)
    .where(sql`burnoutRiskLevel IN ('high','critical')`);

  const [fusionReadyResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(avatars)
    .where(sql`independenceLevel >= 0.70`);

  return {
    activeSessions: Number(activeSessionsResult?.count ?? 0),
    totalAvatars: Number(totalAvatarsResult?.count ?? 0),
    totalAides: Number(totalAidesResult?.count ?? 0),
    highBurnoutCount: Number(highBurnoutResult?.count ?? 0),
    fusionReadyCount: Number(fusionReadyResult?.count ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Fusion Results
// ---------------------------------------------------------------------------
export async function getFusionResults(ownerId?: number, isAdmin = false) {
  const db = await getDb();
  if (!db) return [];
  if (isAdmin) return db.select().from(fusionResults).orderBy(desc(fusionResults.createdAt));
  if (ownerId) return db.select().from(fusionResults).where(eq(fusionResults.ownerId, ownerId)).orderBy(desc(fusionResults.createdAt));
  return db.select().from(fusionResults).orderBy(desc(fusionResults.createdAt));
}

export async function createFusionResult(data: {
  fusionId: string;
  avatarId: string;
  aideId: string;
  success: boolean;
  readinessScore: number;
  failureReason?: string;
  advocateName?: string;
  empathyLevel?: "surface" | "experiential" | "deep" | "transformative";
  dimensionScores?: string;
  ownerId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(fusionResults).values(data);
  const result = await db.select().from(fusionResults).where(eq(fusionResults.fusionId, data.fusionId)).limit(1);
  return result[0] ?? null;
}
