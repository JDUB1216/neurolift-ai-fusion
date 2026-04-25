CREATE TABLE `aides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`aideId` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`expertiseArea` varchar(128),
	`coachingStrategies` json DEFAULT ('[]'),
	`effectivenessScore` float DEFAULT 0,
	`totalInterventions` int DEFAULT 0,
	`successfulInterventions` int DEFAULT 0,
	`ownerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aides_id` PRIMARY KEY(`id`),
	CONSTRAINT `aides_aideId_unique` UNIQUE(`aideId`)
);
--> statement-breakpoint
CREATE TABLE `avatarProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`avatarId` varchar(64) NOT NULL,
	`taskType` varchar(128) NOT NULL,
	`attempts` int DEFAULT 0,
	`successes` int DEFAULT 0,
	`successRate` float DEFAULT 0,
	`independenceLevel` float DEFAULT 0,
	`coachingSessions` int DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `avatarProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `avatars` (
	`id` int AUTO_INCREMENT NOT NULL,
	`avatarId` varchar(64) NOT NULL,
	`traitName` varchar(128) NOT NULL,
	`traitDescription` text,
	`currentState` enum('idle','attempting','struggling','learning','independent','burnout') NOT NULL DEFAULT 'idle',
	`emotionalState` varchar(64) DEFAULT 'neutral',
	`cognitiveLoad` float DEFAULT 0,
	`stressLevel` float DEFAULT 0,
	`burnoutRiskLevel` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
	`independenceLevel` float DEFAULT 0,
	`totalTasksAttempted` int DEFAULT 0,
	`totalTasksCompleted` int DEFAULT 0,
	`totalCoachingSessions` int DEFAULT 0,
	`ownerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `avatars_id` PRIMARY KEY(`id`),
	CONSTRAINT `avatars_avatarId_unique` UNIQUE(`avatarId`)
);
--> statement-breakpoint
CREATE TABLE `burnoutAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`avatarId` varchar(64) NOT NULL,
	`sessionId` varchar(64),
	`riskScore` float NOT NULL,
	`riskLevel` enum('low','medium','high','critical') NOT NULL,
	`stressLevel` float,
	`cognitiveLoad` float,
	`emotionalState` varchar(64),
	`recommendations` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `burnoutAssessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coachingActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`aideId` varchar(64) NOT NULL,
	`avatarId` varchar(64) NOT NULL,
	`coachingType` enum('preventive','reactive','crisis','recovery','independence_building') NOT NULL,
	`urgency` enum('low','medium','high','critical') NOT NULL,
	`strategy` varchar(256),
	`message` text,
	`wasEffective` boolean,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coachingActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fusionResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fusionId` varchar(64) NOT NULL,
	`avatarId` varchar(64) NOT NULL,
	`aideId` varchar(64) NOT NULL,
	`success` boolean DEFAULT false,
	`readinessScore` float,
	`failureReason` text,
	`advocateName` varchar(256),
	`empathyLevel` enum('surface','experiential','deep','transformative'),
	`dimensionScores` json DEFAULT ('{}'),
	`ownerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fusionResults_id` PRIMARY KEY(`id`),
	CONSTRAINT `fusionResults_fusionId_unique` UNIQUE(`fusionId`)
);
--> statement-breakpoint
CREATE TABLE `metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricType` varchar(128) NOT NULL,
	`metricValue` float NOT NULL,
	`avatarId` varchar(64),
	`sessionId` varchar(64),
	`metricData` json DEFAULT ('{}'),
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`avatarId` varchar(64) NOT NULL,
	`taskType` varchar(128),
	`success` boolean DEFAULT false,
	`qualityScore` float DEFAULT 0,
	`attemptNumber` int DEFAULT 1,
	`struggleIndicators` json DEFAULT ('[]'),
	`completionTimeSeconds` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trainingSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`avatarId` varchar(64) NOT NULL,
	`aideId` varchar(64) NOT NULL,
	`scenarioId` varchar(128),
	`scenarioName` varchar(256),
	`status` enum('active','completed','failed','paused') NOT NULL DEFAULT 'active',
	`startTime` timestamp NOT NULL DEFAULT (now()),
	`endTime` timestamp,
	`durationSeconds` int,
	`successfulAttempts` int DEFAULT 0,
	`totalAttempts` int DEFAULT 0,
	`averageQualityScore` float DEFAULT 0,
	`coachingInterventions` int DEFAULT 0,
	`ownerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trainingSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `trainingSessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
ALTER TABLE `aides` ADD CONSTRAINT `aides_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `avatars` ADD CONSTRAINT `avatars_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fusionResults` ADD CONSTRAINT `fusionResults_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trainingSessions` ADD CONSTRAINT `trainingSessions_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;