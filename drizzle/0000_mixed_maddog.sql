CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`company` text NOT NULL,
	`job_title` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`message` text DEFAULT '' NOT NULL,
	`talk_title` text DEFAULT '' NOT NULL,
	`profile` text DEFAULT '' NOT NULL,
	`consent` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_submissions_kind_created` ON `submissions` (`kind`,`created_at`);