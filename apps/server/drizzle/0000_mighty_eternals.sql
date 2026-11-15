CREATE TABLE `OrderItem` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`orderId` integer NOT NULL,
	`productId` integer NOT NULL,
	`quantity` integer NOT NULL,
	`price` real NOT NULL,
	FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `Order` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`total` real NOT NULL,
	`status` text DEFAULT 'AWAITING_PAYMENT' NOT NULL,
	`slipUrl` text,
	`note` text,
	`shippingName` text NOT NULL,
	`phone` text NOT NULL,
	`address` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE cascade ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `Product` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`brand` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'FRAME' NOT NULL,
	`price` real NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`imageUrl` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT "Product_stock_check" CHECK("Product"."stock" >= 0)
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'CUSTOMER' NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_unique` ON `User` (`email`);