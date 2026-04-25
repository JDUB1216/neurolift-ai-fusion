import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const conn = await mysql.createConnection(url);

const tables = [
  `CREATE TABLE IF NOT EXISTS \`aides\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`aideId\` varchar(64) NOT NULL,
    \`name\` varchar(128) NOT NULL,
    \`expertiseArea\` varchar(128),
    \`coachingStrategies\` text,
    \`effectivenessScore\` float DEFAULT 0,
    \`totalInterventions\` int DEFAULT 0,
    \`successfulInterventions\` int DEFAULT 0,
    \`ownerId\` int,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`aides_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`aides_aideId_unique\` UNIQUE(\`aideId\`)
  )`,

  `CREATE TABLE IF NOT EXISTS \`avatarProgress\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`avatarId\` varchar(64) NOT NULL,
    \`taskType\` varchar(128) NOT NULL,
    \`attempts\` int DEFAULT 0,
    \`successes\` int DEFAULT 0,
    \`successRate\` float DEFAULT 0,
    \`independenceLevel\` float DEFAULT 0,
    \`coachingSessions\` int DEFAULT 0,
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`avatarProgress_id\` PRIMARY KEY(\`id\`)
  )`,

  `CREATE TABLE IF NOT EXISTS \`avatars\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`avatarId\` varchar(64) NOT NULL,
    \`traitName\` varchar(128) NOT NULL,
    \`traitDescription\` text,
    \`currentState\` enum('idle','attempting','struggling','learning','independent','burnout') NOT NULL DEFAULT 'idle',
    \`emotionalState\` varchar(64) DEFAULT 'neutral',
    \`cognitiveLoad\` float DEFAULT 0,
    \`stressLevel\` float DEFAULT 0,
    \`burnoutRiskLevel\` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
    \`independenceLevel\` float DEFAULT 0,
    \`totalTasksAttempted\` int DEFAULT 0,
    \`totalTasksCompleted\` int DEFAULT 0,
    \`totalCoachingSessions\` int DEFAULT 0,
    \`ownerId\` int,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`avatars_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`avatars_avatarId_unique\` UNIQUE(\`avatarId\`)
  )`,

  `CREATE TABLE IF NOT EXISTS \`burnoutAssessments\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`avatarId\` varchar(64) NOT NULL,
    \`sessionId\` varchar(64),
    \`riskScore\` float NOT NULL,
    \`riskLevel\` enum('low','medium','high','critical') NOT NULL,
    \`stressLevel\` float,
    \`cognitiveLoad\` float,
    \`emotionalState\` varchar(64),
    \`recommendations\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`burnoutAssessments_id\` PRIMARY KEY(\`id\`)
  )`,

  `CREATE TABLE IF NOT EXISTS \`coachingActions\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`sessionId\` varchar(64) NOT NULL,
    \`aideId\` varchar(64) NOT NULL,
    \`avatarId\` varchar(64) NOT NULL,
    \`coachingType\` enum('preventive','reactive','crisis','recovery','independence_building') NOT NULL,
    \`urgency\` enum('low','medium','high','critical') NOT NULL,
    \`strategy\` varchar(256),
    \`message\` text,
    \`wasEffective\` boolean,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`coachingActions_id\` PRIMARY KEY(\`id\`)
  )`,

  `CREATE TABLE IF NOT EXISTS \`fusionResults\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`fusionId\` varchar(64) NOT NULL,
    \`avatarId\` varchar(64) NOT NULL,
    \`aideId\` varchar(64) NOT NULL,
    \`success\` boolean DEFAULT false,
    \`readinessScore\` float,
    \`failureReason\` text,
    \`advocateName\` varchar(256),
    \`empathyLevel\` enum('surface','experiential','deep','transformative'),
    \`dimensionScores\` text,
    \`ownerId\` int,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`fusionResults_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`fusionResults_fusionId_unique\` UNIQUE(\`fusionId\`)
  )`,

  `CREATE TABLE IF NOT EXISTS \`metrics\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`metricType\` varchar(128) NOT NULL,
    \`metricValue\` float NOT NULL,
    \`avatarId\` varchar(64),
    \`sessionId\` varchar(64),
    \`metricData\` text,
    \`recordedAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`metrics_id\` PRIMARY KEY(\`id\`)
  )`,

  `CREATE TABLE IF NOT EXISTS \`taskResults\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`sessionId\` varchar(64) NOT NULL,
    \`avatarId\` varchar(64) NOT NULL,
    \`taskType\` varchar(128),
    \`success\` boolean DEFAULT false,
    \`qualityScore\` float DEFAULT 0,
    \`attemptNumber\` int DEFAULT 1,
    \`struggleIndicators\` text,
    \`completionTimeSeconds\` int,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`taskResults_id\` PRIMARY KEY(\`id\`)
  )`,

  `CREATE TABLE IF NOT EXISTS \`trainingSessions\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`sessionId\` varchar(64) NOT NULL,
    \`avatarId\` varchar(64) NOT NULL,
    \`aideId\` varchar(64) NOT NULL,
    \`scenarioId\` varchar(128),
    \`scenarioName\` varchar(256),
    \`status\` enum('active','completed','failed','paused') NOT NULL DEFAULT 'active',
    \`startTime\` timestamp NOT NULL DEFAULT (now()),
    \`endTime\` timestamp,
    \`durationSeconds\` int,
    \`successfulAttempts\` int DEFAULT 0,
    \`totalAttempts\` int DEFAULT 0,
    \`averageQualityScore\` float DEFAULT 0,
    \`coachingInterventions\` int DEFAULT 0,
    \`ownerId\` int,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`trainingSessions_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`trainingSessions_sessionId_unique\` UNIQUE(\`sessionId\`)
  )`,
];

for (const sql of tables) {
  const tableName = sql.match(/CREATE TABLE IF NOT EXISTS `(\w+)`/)?.[1];
  try {
    await conn.execute(sql);
    console.log(`✓ ${tableName}`);
  } catch (e) {
    console.error(`✗ ${tableName}:`, e.message);
  }
}

await conn.end();
console.log("Migration complete.");
