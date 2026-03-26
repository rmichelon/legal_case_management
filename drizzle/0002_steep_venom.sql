CREATE TABLE `notificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`deadlineAlerts` boolean NOT NULL DEFAULT true,
	`caseUpdates` boolean NOT NULL DEFAULT true,
	`newMovements` boolean NOT NULL DEFAULT true,
	`documentUploads` boolean NOT NULL DEFAULT true,
	`emailNotifications` boolean NOT NULL DEFAULT true,
	`pushNotifications` boolean NOT NULL DEFAULT true,
	`daysBeforeDeadline` int NOT NULL DEFAULT 3,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notificationPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` int,
	`deadlineId` int,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('deadline_alert','case_update','new_movement','document_uploaded','system') NOT NULL,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`read` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`actionUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
