import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { randomUUID } from "crypto";
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");
const conn = await mysql.createConnection(url);

// ---- Avatars ----
const avatarData = [
  { avatarId: "av-stay-alert", traitName: "StayAlert", traitDescription: "Sustained Attention Deficit — experiences attention drift and hyperfocus cycles", currentState: "learning", emotionalState: "focused", cognitiveLoad: 0.62, stressLevel: 0.45, burnoutRiskLevel: "medium", independenceLevel: 0.58, totalTasksAttempted: 142, totalTasksCompleted: 89, totalCoachingSessions: 34 },
  { avatarId: "av-task-kickstart", traitName: "TaskKickstart", traitDescription: "Task Initiation Difficulty — struggles to begin tasks despite knowing what to do", currentState: "struggling", emotionalState: "frustrated", cognitiveLoad: 0.78, stressLevel: 0.71, burnoutRiskLevel: "high", independenceLevel: 0.31, totalTasksAttempted: 98, totalTasksCompleted: 41, totalCoachingSessions: 52 },
  { avatarId: "av-time-blind", traitName: "TimeBlind", traitDescription: "Time Blindness — difficulty perceiving and managing time passage accurately", currentState: "attempting", emotionalState: "anxious", cognitiveLoad: 0.55, stressLevel: 0.60, burnoutRiskLevel: "medium", independenceLevel: 0.44, totalTasksAttempted: 76, totalTasksCompleted: 38, totalCoachingSessions: 28 },
  { avatarId: "av-hyper-focus", traitName: "HyperFocus", traitDescription: "Hyperfocus Dysregulation — becomes intensely absorbed in tasks, losing track of priorities", currentState: "independent", emotionalState: "engaged", cognitiveLoad: 0.40, stressLevel: 0.25, burnoutRiskLevel: "low", independenceLevel: 0.82, totalTasksAttempted: 203, totalTasksCompleted: 178, totalCoachingSessions: 19 },
  { avatarId: "av-emotion-wave", traitName: "EmotionWave", traitDescription: "Emotional Dysregulation — intense emotional responses that interfere with task execution", currentState: "burnout", emotionalState: "overwhelmed", cognitiveLoad: 0.91, stressLevel: 0.88, burnoutRiskLevel: "critical", independenceLevel: 0.12, totalTasksAttempted: 55, totalTasksCompleted: 14, totalCoachingSessions: 67 },
];

for (const a of avatarData) {
  await conn.execute(
    `INSERT IGNORE INTO avatars (avatarId, traitName, traitDescription, currentState, emotionalState, cognitiveLoad, stressLevel, burnoutRiskLevel, independenceLevel, totalTasksAttempted, totalTasksCompleted, totalCoachingSessions) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [a.avatarId, a.traitName, a.traitDescription, a.currentState, a.emotionalState, a.cognitiveLoad, a.stressLevel, a.burnoutRiskLevel, a.independenceLevel, a.totalTasksAttempted, a.totalTasksCompleted, a.totalCoachingSessions]
  );
}
console.log("✓ Avatars seeded");

// ---- Aides ----
const aideData = [
  { aideId: "aide-focus-coach", name: "FocusCoach", expertiseArea: "Sustained Attention", coachingStrategies: JSON.stringify(["Pomodoro Technique", "Environmental Optimization", "Attention Anchoring", "Break Scheduling"]), effectivenessScore: 0.84, totalInterventions: 312, successfulInterventions: 262 },
  { aideId: "aide-initiation-guide", name: "InitiationGuide", expertiseArea: "Task Initiation", coachingStrategies: JSON.stringify(["Body Doubling", "Micro-Task Decomposition", "Implementation Intentions", "Activation Energy Reduction"]), effectivenessScore: 0.71, totalInterventions: 198, successfulInterventions: 141 },
  { aideId: "aide-time-anchor", name: "TimeAnchor", expertiseArea: "Time Management", coachingStrategies: JSON.stringify(["Time Boxing", "External Time Cues", "Transition Warnings", "Deadline Visualization"]), effectivenessScore: 0.78, totalInterventions: 145, successfulInterventions: 113 },
  { aideId: "aide-burnout-shield", name: "BurnoutShield", expertiseArea: "Burnout Prevention & RRT", coachingStrategies: JSON.stringify(["Rapid Recovery Technique", "Stress Inoculation", "Recovery Pacing", "Crisis De-escalation"]), effectivenessScore: 0.91, totalInterventions: 89, successfulInterventions: 81 },
];

for (const a of aideData) {
  await conn.execute(
    `INSERT IGNORE INTO aides (aideId, name, expertiseArea, coachingStrategies, effectivenessScore, totalInterventions, successfulInterventions) VALUES (?,?,?,?,?,?,?)`,
    [a.aideId, a.name, a.expertiseArea, a.coachingStrategies, a.effectivenessScore, a.totalInterventions, a.successfulInterventions]
  );
}
console.log("✓ Aides seeded");

// ---- Training Sessions ----
const scenarios = [
  { id: "scen-workplace-email", name: "Workplace Email Management" },
  { id: "scen-project-planning", name: "Project Planning & Prioritization" },
  { id: "scen-meeting-prep", name: "Meeting Preparation" },
  { id: "scen-deadline-task", name: "Deadline-Driven Task Completion" },
];

const sessionPairs = [
  { avatarId: "av-stay-alert", aideId: "aide-focus-coach", status: "active" },
  { avatarId: "av-task-kickstart", aideId: "aide-initiation-guide", status: "active" },
  { avatarId: "av-time-blind", aideId: "aide-time-anchor", status: "paused" },
  { avatarId: "av-hyper-focus", aideId: "aide-focus-coach", status: "completed" },
  { avatarId: "av-emotion-wave", aideId: "aide-burnout-shield", status: "completed" },
  { avatarId: "av-stay-alert", aideId: "aide-burnout-shield", status: "completed" },
];

const sessionIds = [];
for (let i = 0; i < sessionPairs.length; i++) {
  const p = sessionPairs[i];
  const scen = scenarios[i % scenarios.length];
  const sid = `sess-${randomUUID().slice(0, 8)}`;
  sessionIds.push({ sessionId: sid, avatarId: p.avatarId, aideId: p.aideId });
  const durationSeconds = p.status === "completed" ? Math.floor(Math.random() * 3600 + 600) : null;
  const endTime = p.status === "completed" ? new Date(Date.now() - Math.random() * 86400000 * 7) : null;
  const successfulAttempts = Math.floor(Math.random() * 8 + 2);
  const totalAttempts = successfulAttempts + Math.floor(Math.random() * 4);
  const avgQuality = parseFloat((Math.random() * 0.4 + 0.5).toFixed(2));
  const coaching = Math.floor(Math.random() * 10 + 1);

  await conn.execute(
    `INSERT IGNORE INTO trainingSessions (sessionId, avatarId, aideId, scenarioId, scenarioName, status, endTime, durationSeconds, successfulAttempts, totalAttempts, averageQualityScore, coachingInterventions) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [sid, p.avatarId, p.aideId, scen.id, scen.name, p.status, endTime, durationSeconds, successfulAttempts, totalAttempts, avgQuality, coaching]
  );
}
console.log("✓ Training sessions seeded");

// ---- Task Results ----
const taskTypes = ["email-triage", "calendar-block", "report-draft", "meeting-agenda", "priority-sort"];
for (const s of sessionIds.slice(0, 4)) {
  for (let t = 0; t < 5; t++) {
    const success = Math.random() > 0.35;
    const quality = parseFloat((Math.random() * 0.5 + (success ? 0.5 : 0.1)).toFixed(2));
    const struggles = success ? "[]" : JSON.stringify(["attention_drift", "task_switching"]);
    await conn.execute(
      `INSERT INTO taskResults (sessionId, avatarId, taskType, success, qualityScore, attemptNumber, struggleIndicators, completionTimeSeconds) VALUES (?,?,?,?,?,?,?,?)`,
      [s.sessionId, s.avatarId, taskTypes[t % taskTypes.length], success, quality, t + 1, struggles, Math.floor(Math.random() * 600 + 60)]
    );
  }
}
console.log("✓ Task results seeded");

// ---- Coaching Actions ----
const coachingTypes = ["preventive", "reactive", "crisis", "recovery", "independence_building"];
const urgencies = ["low", "medium", "high", "critical"];
const strategies = ["Pomodoro Technique", "Body Doubling", "Micro-Task Decomposition", "Rapid Recovery Technique", "Time Boxing"];
const messages = [
  "Let's break this down into smaller steps. What's the very first action you can take?",
  "I notice your attention is drifting. Let's reset with a 2-minute breathing exercise.",
  "You're showing signs of high stress. Let's pause and apply the rapid recovery protocol.",
  "Great progress! You completed that independently. Let's try the next task with less support.",
  "I'm setting a 25-minute focus timer. After that, we'll take a 5-minute break.",
];

for (const s of sessionIds.slice(0, 4)) {
  for (let c = 0; c < 4; c++) {
    const ctype = coachingTypes[c % coachingTypes.length];
    await conn.execute(
      `INSERT INTO coachingActions (sessionId, aideId, avatarId, coachingType, urgency, strategy, message, wasEffective) VALUES (?,?,?,?,?,?,?,?)`,
      [s.sessionId, s.aideId, s.avatarId, ctype, urgencies[c % urgencies.length], strategies[c % strategies.length], messages[c % messages.length], Math.random() > 0.3]
    );
  }
}
console.log("✓ Coaching actions seeded");

// ---- Burnout Assessments ----
const burnoutAvatars = [
  { avatarId: "av-emotion-wave", riskScore: 0.91, riskLevel: "critical", stressLevel: 0.88, cognitiveLoad: 0.91, emotionalState: "overwhelmed", recommendations: JSON.stringify(["Immediate session pause", "Crisis de-escalation protocol", "Reduce task complexity by 70%"]) },
  { avatarId: "av-task-kickstart", riskScore: 0.72, riskLevel: "high", stressLevel: 0.71, cognitiveLoad: 0.78, emotionalState: "frustrated", recommendations: JSON.stringify(["Reduce session frequency", "Increase recovery time", "Apply RRT protocol"]) },
  { avatarId: "av-stay-alert", riskScore: 0.48, riskLevel: "medium", stressLevel: 0.45, cognitiveLoad: 0.62, emotionalState: "focused", recommendations: JSON.stringify(["Monitor stress trends", "Schedule preventive breaks"]) },
  { avatarId: "av-time-blind", riskScore: 0.55, riskLevel: "medium", stressLevel: 0.60, cognitiveLoad: 0.55, emotionalState: "anxious", recommendations: JSON.stringify(["Time management coaching", "Reduce deadline pressure"]) },
  { avatarId: "av-hyper-focus", riskScore: 0.18, riskLevel: "low", stressLevel: 0.25, cognitiveLoad: 0.40, emotionalState: "engaged", recommendations: JSON.stringify(["Continue current pacing", "Monitor hyperfocus episodes"]) },
];

// Seed multiple historical assessments per avatar for trend charts
for (const b of burnoutAvatars) {
  for (let day = 6; day >= 0; day--) {
    const variance = (Math.random() - 0.5) * 0.12;
    const riskScore = Math.min(1, Math.max(0, b.riskScore + variance));
    const createdAt = new Date(Date.now() - day * 86400000);
    await conn.execute(
      `INSERT INTO burnoutAssessments (avatarId, riskScore, riskLevel, stressLevel, cognitiveLoad, emotionalState, recommendations, createdAt) VALUES (?,?,?,?,?,?,?,?)`,
      [b.avatarId, riskScore, b.riskLevel, b.stressLevel, b.cognitiveLoad, b.emotionalState, b.recommendations, createdAt]
    );
  }
}
console.log("✓ Burnout assessments seeded");

// ---- Metrics ----
const metricTypes = ["session_success_rate", "session_quality", "burnout_risk", "independence_level"];
for (const a of avatarData) {
  for (let day = 13; day >= 0; day--) {
    for (const mt of metricTypes) {
      const value = parseFloat((Math.random() * 0.6 + 0.2).toFixed(3));
      const recordedAt = new Date(Date.now() - day * 86400000);
      await conn.execute(
        `INSERT INTO metrics (metricType, metricValue, avatarId, metricData, recordedAt) VALUES (?,?,?,?,?)`,
        [mt, value, a.avatarId, JSON.stringify({ avatarName: a.traitName }), recordedAt]
      );
    }
  }
}
console.log("✓ Metrics seeded");

// ---- Avatar Progress ----
const taskTypesList = ["email-triage", "calendar-block", "report-draft", "meeting-agenda", "priority-sort"];
for (const a of avatarData) {
  for (const tt of taskTypesList) {
    const attempts = Math.floor(Math.random() * 30 + 5);
    const successes = Math.floor(attempts * (Math.random() * 0.5 + 0.3));
    const successRate = parseFloat((successes / attempts).toFixed(3));
    const indLevel = parseFloat((Math.random() * 0.7 + 0.1).toFixed(3));
    await conn.execute(
      `INSERT INTO avatarProgress (avatarId, taskType, attempts, successes, successRate, independenceLevel, coachingSessions) VALUES (?,?,?,?,?,?,?)`,
      [a.avatarId, tt, attempts, successes, successRate, indLevel, Math.floor(Math.random() * 15 + 2)]
    );
  }
}
console.log("✓ Avatar progress seeded");

// ---- Fusion Results ----
const fusionData = [
  { avatarId: "av-hyper-focus", aideId: "aide-focus-coach", success: true, readinessScore: 0.88, advocateName: "HyperFocus Advocate — Attention Mastery", empathyLevel: "deep", dimensionScores: JSON.stringify({ independence: 0.92, task_mastery: 0.85, emotional_regulation: 0.78, aide_effectiveness: 0.91, session_quality: 0.88 }) },
  { avatarId: "av-stay-alert", aideId: "aide-burnout-shield", success: false, readinessScore: 0.54, advocateName: null, empathyLevel: null, failureReason: "Independence level below threshold (0.58 < 0.70)", dimensionScores: JSON.stringify({ independence: 0.58, task_mastery: 0.62, emotional_regulation: 0.55, aide_effectiveness: 0.84, session_quality: 0.71 }) },
];

for (const f of fusionData) {
  const fusionId = `fusion-${randomUUID().slice(0, 8)}`;
  await conn.execute(
    `INSERT IGNORE INTO fusionResults (fusionId, avatarId, aideId, success, readinessScore, failureReason, advocateName, empathyLevel, dimensionScores) VALUES (?,?,?,?,?,?,?,?,?)`,
    [fusionId, f.avatarId, f.aideId, f.success, f.readinessScore, f.failureReason || null, f.advocateName || null, f.empathyLevel || null, f.dimensionScores]
  );
}
console.log("✓ Fusion results seeded");

await conn.end();
console.log("\n✅ All demo data seeded successfully.");
