CREATE TABLE `syncConflicts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integrationId` int NOT NULL,
	`userId` int NOT NULL,
	`googleEventId` varchar(255) NOT NULL,
	`caseId` int,
	`deadlineId` int,
	`conflictType` enum('modified_both','deleted_both','timestamp_mismatch','data_mismatch') NOT NULL,
	`googleData` text NOT NULL,
	`systemData` text NOT NULL,
	`status` enum('unresolved','resolved','ignored') NOT NULL DEFAULT 'unresolved',
	`resolution` enum('keep_google','keep_system','merge','manual'),
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `syncConflicts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `syncHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integrationId` int NOT NULL,
	`userId` int NOT NULL,
	`eventType` enum('created','updated','deleted') NOT NULL,
	`sourceSystem` enum('google_calendar','legal_system') NOT NULL,
	`googleEventId` varchar(255),
	`caseId` int,
	`deadlineId` int,
	`status` enum('success','failed','conflict','skipped') NOT NULL DEFAULT 'success',
	`conflictType` enum('none','modified_both','deleted_both','timestamp_mismatch'),
	`conflictResolution` enum('keep_google','keep_system','manual'),
	`errorMessage` text,
	`metadata` text,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `syncHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhookSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integrationId` int NOT NULL,
	`userId` int NOT NULL,
	`calendarId` varchar(255) NOT NULL,
	`resourceId` varchar(255) NOT NULL,
	`channelId` varchar(255) NOT NULL,
	`expiration` timestamp NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastNotificationAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhookSubscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhookSubscriptions_resourceId_unique` UNIQUE(`resourceId`),
	CONSTRAINT `webhookSubscriptions_channelId_unique` UNIQUE(`channelId`)
);
