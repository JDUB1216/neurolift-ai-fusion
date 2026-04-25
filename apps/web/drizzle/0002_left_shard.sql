ALTER TABLE `aides` MODIFY COLUMN `coachingStrategies` text DEFAULT ('[]');--> statement-breakpoint
ALTER TABLE `burnoutAssessments` MODIFY COLUMN `recommendations` text DEFAULT ('[]');--> statement-breakpoint
ALTER TABLE `fusionResults` MODIFY COLUMN `dimensionScores` text DEFAULT ('{}');--> statement-breakpoint
ALTER TABLE `metrics` MODIFY COLUMN `metricData` text DEFAULT ('{}');--> statement-breakpoint
ALTER TABLE `taskResults` MODIFY COLUMN `struggleIndicators` text DEFAULT ('[]');