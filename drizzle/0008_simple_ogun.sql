CREATE TABLE `alertHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`alertType` enum('deadline','case_update','document','performance','daily_report') NOT NULL,
	`channel` enum('email','sms','push','in_app') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`relatedCaseId` int,
	`relatedDeadlineId` int,
	`status` enum('sent','failed','pending') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`readAt` timestamp,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alertHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alertPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`alertType` enum('email','sms','push','in_app') NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`frequency` enum('immediate','hourly','daily','weekly') NOT NULL DEFAULT 'daily',
	`channels` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alertPreferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `controladoria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('active','inactive','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `controladoria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `controladoriaAccess` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('admin','lawyer','partner','manager') NOT NULL,
	`canViewAllCases` boolean DEFAULT false,
	`canViewAllDeadlines` boolean DEFAULT false,
	`canViewReports` boolean DEFAULT false,
	`canManageAlerts` boolean DEFAULT false,
	`canGenerateReports` boolean DEFAULT false,
	`canManageUsers` boolean DEFAULT false,
	`canViewPerformanceMetrics` boolean DEFAULT false,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`grantedBy` int NOT NULL,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `controladoriaAccess_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailyReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reportDate` timestamp NOT NULL,
	`totalCases` int DEFAULT 0,
	`activeCases` int DEFAULT 0,
	`closedCases` int DEFAULT 0,
	`overduePrazos` int DEFAULT 0,
	`upcomingPrazos` int DEFAULT 0,
	`totalDeadlines` int DEFAULT 0,
	`completedDeadlines` int DEFAULT 0,
	`totalLawyers` int DEFAULT 0,
	`activeLawyers` int DEFAULT 0,
	`totalClients` int DEFAULT 0,
	`newCases` int DEFAULT 0,
	`closedCasesToday` int DEFAULT 0,
	`totalDocuments` int DEFAULT 0,
	`newDocuments` int DEFAULT 0,
	`successRate` decimal(5,2) DEFAULT '0.00',
	`averageResolutionTime` int DEFAULT 0,
	`totalRevenue` decimal(15,2) DEFAULT '0.00',
	`reportContent` json,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dailyReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performanceMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lawyerId` int,
	`metricsDate` timestamp NOT NULL,
	`casesHandled` int DEFAULT 0,
	`casesClosed` int DEFAULT 0,
	`successRate` decimal(5,2) DEFAULT '0.00',
	`averageResolutionDays` int DEFAULT 0,
	`deadlinesMissed` int DEFAULT 0,
	`clientSatisfaction` decimal(3,1) DEFAULT '0.0',
	`billableHours` decimal(10,2) DEFAULT '0.00',
	`revenue` decimal(15,2) DEFAULT '0.00',
	`casesByType` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performanceMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduledReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reportType` enum('daily','weekly','monthly','custom') NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`schedule` varchar(100) NOT NULL,
	`recipients` json,
	`includeMetrics` json,
	`format` enum('pdf','email','both') NOT NULL DEFAULT 'email',
	`enabled` boolean NOT NULL DEFAULT true,
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduledReports_id` PRIMARY KEY(`id`)
);
