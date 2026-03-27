CREATE TABLE `caseAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`lawyerId` int NOT NULL,
	`role` enum('lead','co_counsel','junior','consultant') NOT NULL DEFAULT 'lead',
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`assignedBy` int NOT NULL,
	`unassignedAt` timestamp,
	`hoursWorked` decimal(10,2) DEFAULT '0.00',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `caseAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lawyerAvailability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lawyerId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lawyerAvailability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lawyerPerformance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lawyerId` int NOT NULL,
	`period` enum('daily','weekly','monthly','yearly') NOT NULL,
	`periodDate` timestamp NOT NULL,
	`totalCasesAssigned` int DEFAULT 0,
	`activeCases` int DEFAULT 0,
	`closedCases` int DEFAULT 0,
	`successfulCases` int DEFAULT 0,
	`totalHoursWorked` decimal(10,2) DEFAULT '0.00',
	`totalBilled` decimal(15,2) DEFAULT '0.00',
	`averageHoursPerCase` decimal(10,2) DEFAULT '0.00',
	`caseSuccessRate` decimal(5,2) DEFAULT '0.00',
	`clientSatisfactionRating` decimal(3,2),
	`deadlinesMissed` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lawyerPerformance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lawyerPermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lawyerId` int NOT NULL,
	`permission` varchar(100) NOT NULL,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`grantedBy` int NOT NULL,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lawyerPermissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lawyerSkills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lawyerId` int NOT NULL,
	`skillName` varchar(255) NOT NULL,
	`proficiencyLevel` enum('beginner','intermediate','advanced','expert') NOT NULL DEFAULT 'intermediate',
	`certificationNumber` varchar(100),
	`certificationDate` timestamp,
	`expiryDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lawyerSkills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lawyerWorkload` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lawyerId` int NOT NULL,
	`date` timestamp NOT NULL DEFAULT (now()),
	`scheduledHours` decimal(10,2) DEFAULT '0.00',
	`actualHours` decimal(10,2) DEFAULT '0.00',
	`activeCaseCount` int DEFAULT 0,
	`deadlineCount` int DEFAULT 0,
	`overloadPercentage` decimal(5,2) DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lawyerWorkload_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lawyers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`oabNumber` varchar(20),
	`oabState` varchar(2),
	`specialties` text,
	`bio` text,
	`profileImage` varchar(500),
	`status` enum('active','inactive','on_leave','retired') NOT NULL DEFAULT 'active',
	`joinDate` timestamp NOT NULL DEFAULT (now()),
	`yearsOfExperience` int,
	`hourlyRate` decimal(10,2),
	`officeLocation` varchar(255),
	`workingHours` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lawyers_id` PRIMARY KEY(`id`),
	CONSTRAINT `lawyers_oabNumber_unique` UNIQUE(`oabNumber`)
);
