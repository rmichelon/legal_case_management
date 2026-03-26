CREATE TABLE `calendarEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integrationId` int NOT NULL,
	`caseId` int NOT NULL,
	`deadlineId` int,
	`googleEventId` varchar(255) NOT NULL,
	`eventType` enum('deadline','movement','hearing','other') NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp,
	`location` varchar(500),
	`isAllDay` boolean NOT NULL DEFAULT false,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`lastModifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendarEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `calendarEvents_googleEventId_unique` UNIQUE(`googleEventId`)
);
--> statement-breakpoint
CREATE TABLE `googleCalendarIntegrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`googleAccountEmail` varchar(320) NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`calendarId` varchar(255) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`syncDeadlines` boolean NOT NULL DEFAULT true,
	`syncMovements` boolean NOT NULL DEFAULT true,
	`syncHearings` boolean NOT NULL DEFAULT true,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `googleCalendarIntegrations_id` PRIMARY KEY(`id`)
);
