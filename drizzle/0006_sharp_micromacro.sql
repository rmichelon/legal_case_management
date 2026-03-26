CREATE TABLE `apiErrorLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tribunal` enum('tjsp','tjmg','tjms') NOT NULL,
	`endpoint` varchar(500) NOT NULL,
	`method` varchar(10) NOT NULL,
	`statusCode` int,
	`errorType` varchar(100) NOT NULL,
	`errorMessage` text,
	`requestPayload` text,
	`responsePayload` text,
	`userId` int,
	`caseId` int,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`resolved` boolean DEFAULT false,
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `apiErrorLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integrationAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tribunal` enum('tjsp','tjmg','tjms') NOT NULL,
	`alertType` enum('health_check_failed','sync_failed','rate_limit_exceeded','auth_failed','timeout','high_error_rate') NOT NULL,
	`severity` enum('warning','error','critical') NOT NULL DEFAULT 'error',
	`title` varchar(255) NOT NULL,
	`description` text,
	`affectedCases` int DEFAULT 0,
	`triggeredAt` timestamp NOT NULL,
	`resolvedAt` timestamp,
	`acknowledged` boolean DEFAULT false,
	`acknowledgedBy` int,
	`acknowledgedAt` timestamp,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integrationAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integrationConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tribunal` enum('tjsp','tjmg','tjms') NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`apiUrl` varchar(500) NOT NULL,
	`authType` enum('certificate','api_key','oauth','basic_auth') NOT NULL,
	`credentials` text NOT NULL,
	`certificatePath` varchar(500),
	`apiKey` varchar(500),
	`oauthClientId` varchar(500),
	`oauthClientSecret` varchar(500),
	`syncInterval` int DEFAULT 3600,
	`retryAttempts` int DEFAULT 3,
	`retryDelay` int DEFAULT 5000,
	`enableHealthCheck` boolean DEFAULT true,
	`healthCheckInterval` int DEFAULT 300,
	`lastTestedAt` timestamp,
	`testStatus` enum('success','failed','not_tested') DEFAULT 'not_tested',
	`testErrorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrationConfig_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performanceReport` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tribunal` enum('tjsp','tjmg','tjms') NOT NULL,
	`reportDate` timestamp NOT NULL,
	`period` enum('daily','weekly','monthly') NOT NULL,
	`totalSyncs` int DEFAULT 0,
	`successfulSyncs` int DEFAULT 0,
	`failedSyncs` int DEFAULT 0,
	`successRate` decimal(5,2) DEFAULT '0.00',
	`averageResponseTime` int,
	`minResponseTime` int,
	`maxResponseTime` int,
	`totalRecordsProcessed` int DEFAULT 0,
	`totalErrors` int DEFAULT 0,
	`uptime` decimal(5,2) DEFAULT '100.00',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performanceReport_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `syncMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`userId` int NOT NULL,
	`tribunal` enum('tjsp','tjmg','tjms') NOT NULL,
	`syncType` enum('full','incremental','manual') NOT NULL DEFAULT 'manual',
	`status` enum('pending','in_progress','success','failed') NOT NULL DEFAULT 'pending',
	`startTime` timestamp NOT NULL,
	`endTime` timestamp,
	`duration` int,
	`recordsProcessed` int DEFAULT 0,
	`recordsUpdated` int DEFAULT 0,
	`recordsCreated` int DEFAULT 0,
	`recordsFailed` int DEFAULT 0,
	`errorMessage` text,
	`retryCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `syncMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tribunalHealthCheck` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tribunal` enum('tjsp','tjmg','tjms') NOT NULL,
	`status` enum('healthy','degraded','down') NOT NULL DEFAULT 'healthy',
	`responseTime` int,
	`lastCheckAt` timestamp NOT NULL,
	`lastSuccessAt` timestamp,
	`lastFailureAt` timestamp,
	`failureCount` int DEFAULT 0,
	`successCount` int DEFAULT 0,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tribunalHealthCheck_id` PRIMARY KEY(`id`)
);
