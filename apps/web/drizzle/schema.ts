import {
  boolean,
  float,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ---------------------------------------------------------------------------
// Core user table
// ---------------------------------------------------------------------------
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ---------------------------------------------------------------------------
// Avatars — ADHD trait personas
// ---------------------------------------------------------------------------
export const avatars = mysqlTable("avatars", {
  id: int("id").autoincrement().primaryKey(),
  avatarId: varchar("avatarId", { length: 64 }).notNull().unique(),
  traitName: varchar("traitName", { length: 128 }).notNull(),
  traitDescription: text("traitDescription"),
  currentState: mysqlEnum("currentState", [
    "idle",
    "attempting",
    "struggling",
    "learning",
    "independent",
    "burnout",
  ])
    .default("idle")
    .notNull(),
  emotionalState: varchar("emotionalState", { length: 64 }).default("neutral"),
  cognitiveLoad: float("cognitiveLoad").default(0.0),
  stressLevel: float("stressLevel").default(0.0),
  burnoutRiskLevel: mysqlEnum("burnoutRiskLevel", [
    "low",
    "medium",
    "high",
    "critical",
  ])
    .default("low")
    .notNull(),
  independenceLevel: float("independenceLevel").default(0.0),
  totalTasksAttempted: int("totalTasksAttempted").default(0),
  totalTasksCompleted: int("totalTasksCompleted").default(0),
  totalCoachingSessions: int("totalCoachingSessions").default(0),
  ownerId: int("ownerId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Avatar = typeof avatars.$inferSelect;
export type InsertAvatar = typeof avatars.$inferInsert;

// ---------------------------------------------------------------------------
// Avatar progress — per task-type learning progression
// ---------------------------------------------------------------------------
export const avatarProgress = mysqlTable("avatarProgress", {
  id: int("id").autoincrement().primaryKey(),
  avatarId: varchar("avatarId", { length: 64 }).notNull(),
  taskType: varchar("taskType", { length: 128 }).notNull(),
  attempts: int("attempts").default(0),
  successes: int("successes").default(0),
  successRate: float("successRate").default(0.0),
  independenceLevel: float("independenceLevel").default(0.0),
  coachingSessions: int("coachingSessions").default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AvatarProgress = typeof avatarProgress.$inferSelect;

// ---------------------------------------------------------------------------
// Aides — coaching AI personas
// ---------------------------------------------------------------------------
export const aides = mysqlTable("aides", {
  id: int("id").autoincrement().primaryKey(),
  aideId: varchar("aideId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  expertiseArea: varchar("expertiseArea", { length: 128 }),
  coachingStrategies: text("coachingStrategies").default("[]"), // JSON string
  effectivenessScore: float("effectivenessScore").default(0.0),
  totalInterventions: int("totalInterventions").default(0),
  successfulInterventions: int("successfulInterventions").default(0),
  ownerId: int("ownerId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Aide = typeof aides.$inferSelect;
export type InsertAide = typeof aides.$inferInsert;

// ---------------------------------------------------------------------------
// Training sessions
// ---------------------------------------------------------------------------
export const trainingSessions = mysqlTable("trainingSessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  avatarId: varchar("avatarId", { length: 64 }).notNull(),
  aideId: varchar("aideId", { length: 64 }).notNull(),
  scenarioId: varchar("scenarioId", { length: 128 }),
  scenarioName: varchar("scenarioName", { length: 256 }),
  status: mysqlEnum("status", ["active", "completed", "failed", "paused"])
    .default("active")
    .notNull(),
  startTime: timestamp("startTime").defaultNow().notNull(),
  endTime: timestamp("endTime"),
  durationSeconds: int("durationSeconds"),
  successfulAttempts: int("successfulAttempts").default(0),
  totalAttempts: int("totalAttempts").default(0),
  averageQualityScore: float("averageQualityScore").default(0.0),
  coachingInterventions: int("coachingInterventions").default(0),
  ownerId: int("ownerId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrainingSession = typeof trainingSessions.$inferSelect;
export type InsertTrainingSession = typeof trainingSessions.$inferInsert;

// ---------------------------------------------------------------------------
// Task results — individual task attempts within a session
// ---------------------------------------------------------------------------
export const taskResults = mysqlTable("taskResults", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  avatarId: varchar("avatarId", { length: 64 }).notNull(),
  taskType: varchar("taskType", { length: 128 }),
  success: boolean("success").default(false),
  qualityScore: float("qualityScore").default(0.0),
  attemptNumber: int("attemptNumber").default(1),
  struggleIndicators: text("struggleIndicators").default("[]"), // JSON string
  completionTimeSeconds: int("completionTimeSeconds"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskResult = typeof taskResults.$inferSelect;

// ---------------------------------------------------------------------------
// Coaching actions — interventions during sessions
// ---------------------------------------------------------------------------
export const coachingActions = mysqlTable("coachingActions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  aideId: varchar("aideId", { length: 64 }).notNull(),
  avatarId: varchar("avatarId", { length: 64 }).notNull(),
  coachingType: mysqlEnum("coachingType", [
    "preventive",
    "reactive",
    "crisis",
    "recovery",
    "independence_building",
  ]).notNull(),
  urgency: mysqlEnum("urgency", ["low", "medium", "high", "critical"]).notNull(),
  strategy: varchar("strategy", { length: 256 }),
  message: text("message"),
  wasEffective: boolean("wasEffective"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoachingAction = typeof coachingActions.$inferSelect;

// ---------------------------------------------------------------------------
// Burnout assessments
// ---------------------------------------------------------------------------
export const burnoutAssessments = mysqlTable("burnoutAssessments", {
  id: int("id").autoincrement().primaryKey(),
  avatarId: varchar("avatarId", { length: 64 }).notNull(),
  sessionId: varchar("sessionId", { length: 64 }),
  riskScore: float("riskScore").notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).notNull(),
  stressLevel: float("stressLevel"),
  cognitiveLoad: float("cognitiveLoad"),
  emotionalState: varchar("emotionalState", { length: 64 }),
  recommendations: text("recommendations").default("[]"), // JSON string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BurnoutAssessment = typeof burnoutAssessments.$inferSelect;

// ---------------------------------------------------------------------------
// Metrics — aggregated analytics
// ---------------------------------------------------------------------------
export const metrics = mysqlTable("metrics", {
  id: int("id").autoincrement().primaryKey(),
  metricType: varchar("metricType", { length: 128 }).notNull(),
  metricValue: float("metricValue").notNull(),
  avatarId: varchar("avatarId", { length: 64 }),
  sessionId: varchar("sessionId", { length: 64 }),
  metricData: text("metricData").default("{}"), // JSON string
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type Metric = typeof metrics.$inferSelect;

// ---------------------------------------------------------------------------
// Fusion results — advocate creation records
// ---------------------------------------------------------------------------
export const fusionResults = mysqlTable("fusionResults", {
  id: int("id").autoincrement().primaryKey(),
  fusionId: varchar("fusionId", { length: 64 }).notNull().unique(),
  avatarId: varchar("avatarId", { length: 64 }).notNull(),
  aideId: varchar("aideId", { length: 64 }).notNull(),
  success: boolean("success").default(false),
  readinessScore: float("readinessScore"),
  failureReason: text("failureReason"),
  advocateName: varchar("advocateName", { length: 256 }),
  empathyLevel: mysqlEnum("empathyLevel", [
    "surface",
    "experiential",
    "deep",
    "transformative",
  ]),
  dimensionScores: text("dimensionScores").default("{}"), // JSON string
  ownerId: int("ownerId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FusionResult = typeof fusionResults.$inferSelect;
