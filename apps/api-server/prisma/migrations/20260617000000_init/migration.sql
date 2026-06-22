CREATE TABLE `roles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(32) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) NULL,
  `is_system` BOOLEAN NOT NULL DEFAULT true,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `roles_code_key` (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NULL,
  `email` VARCHAR(100) NULL,
  `role_id` INT NOT NULL,
  `status` ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
  `last_login_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `users_username_key` (`username`),
  INDEX `users_role_id_idx` (`role_id`),
  INDEX `users_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cocktails` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name_zh` VARCHAR(100) NOT NULL,
  `name_en` VARCHAR(100) NULL,
  `slug` VARCHAR(150) NULL,
  `short_description` VARCHAR(500) NULL,
  `description` TEXT NULL,
  `base_spirit` VARCHAR(100) NULL,
  `abv_note` VARCHAR(50) NULL,
  `glass_type` VARCHAR(100) NULL,
  `taste_profile` VARCHAR(255) NULL,
  `garnish` VARCHAR(255) NULL,
  `method` TEXT NULL,
  `scene` VARCHAR(255) NULL,
  `cover_image_url` VARCHAR(500) NULL,
  `publish_status` ENUM('draft', 'published', 'hidden') NOT NULL DEFAULT 'draft',
  `is_visible` BOOLEAN NOT NULL DEFAULT true,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_by` INT NULL,
  `updated_by` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `cocktails_slug_key` (`slug`),
  INDEX `cocktails_name_zh_idx` (`name_zh`),
  INDEX `cocktails_publish_status_idx` (`publish_status`),
  INDEX `cocktails_is_visible_idx` (`is_visible`),
  INDEX `cocktails_sort_order_idx` (`sort_order`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(150) NULL,
  `description` VARCHAR(255) NULL,
  `is_enabled` BOOLEAN NOT NULL DEFAULT true,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `categories_name_key` (`name`),
  UNIQUE INDEX `categories_slug_key` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cocktail_categories` (
  `cocktail_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `is_primary` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`cocktail_id`, `category_id`),
  INDEX `cocktail_categories_category_id_idx` (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `tags` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `slug` VARCHAR(100) NULL,
  `color` VARCHAR(20) NULL,
  `is_enabled` BOOLEAN NOT NULL DEFAULT true,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `tags_name_key` (`name`),
  UNIQUE INDEX `tags_slug_key` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cocktail_tags` (
  `cocktail_id` INT NOT NULL,
  `tag_id` INT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`cocktail_id`, `tag_id`),
  INDEX `cocktail_tags_tag_id_idx` (`tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ingredients` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) NULL,
  `abv` DECIMAL(5, 2) NULL,
  `is_enabled` BOOLEAN NOT NULL DEFAULT true,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ingredients_name_key` (`name`),
  INDEX `ingredients_category_idx` (`category`),
  INDEX `ingredients_is_enabled_idx` (`is_enabled`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cocktail_recipes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cocktail_id` INT NOT NULL,
  `ingredient_id` INT NOT NULL,
  `ingredient_name_snapshot` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(10, 2) NULL,
  `unit` VARCHAR(20) NULL,
  `note` VARCHAR(255) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `cocktail_recipes_cocktail_id_idx` (`cocktail_id`),
  INDEX `cocktail_recipes_ingredient_id_idx` (`ingredient_id`),
  INDEX `cocktail_recipes_cocktail_id_sort_order_idx` (`cocktail_id`, `sort_order`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cocktail_images` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cocktail_id` INT NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `image_type` ENUM('cover', 'detail') NOT NULL DEFAULT 'detail',
  `alt_text` VARCHAR(255) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `cocktail_images_cocktail_id_idx` (`cocktail_id`),
  INDEX `cocktail_images_image_type_idx` (`image_type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `production_tasks` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `task_no` VARCHAR(32) NOT NULL,
  `cocktail_id` INT NOT NULL,
  `cocktail_name_snapshot` VARCHAR(100) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `remark` VARCHAR(500) NULL,
  `status` ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
  `priority` INT NOT NULL DEFAULT 3,
  `created_by_user_id` INT NOT NULL,
  `assigned_to_user_id` INT NULL,
  `started_at` DATETIME(3) NULL,
  `completed_at` DATETIME(3) NULL,
  `completed_by_user_id` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `production_tasks_task_no_key` (`task_no`),
  INDEX `production_tasks_status_idx` (`status`),
  INDEX `production_tasks_created_by_user_id_idx` (`created_by_user_id`),
  INDEX `production_tasks_assigned_to_user_id_idx` (`assigned_to_user_id`),
  INDEX `production_tasks_completed_by_user_id_idx` (`completed_by_user_id`),
  INDEX `production_tasks_created_at_idx` (`created_at`),
  INDEX `production_tasks_status_created_at_idx` (`status`, `created_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `production_task_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `task_id` INT NOT NULL,
  `action_type` VARCHAR(30) NOT NULL,
  `from_status` ENUM('pending', 'in_progress', 'completed') NULL,
  `to_status` ENUM('pending', 'in_progress', 'completed') NULL,
  `operator_user_id` INT NOT NULL,
  `action_note` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `production_task_logs_task_id_idx` (`task_id`),
  INDEX `production_task_logs_operator_user_id_idx` (`operator_user_id`),
  INDEX `production_task_logs_created_at_idx` (`created_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cocktails` ADD CONSTRAINT `cocktails_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `cocktails` ADD CONSTRAINT `cocktails_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `cocktail_categories` ADD CONSTRAINT `cocktail_categories_cocktail_id_fkey` FOREIGN KEY (`cocktail_id`) REFERENCES `cocktails`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `cocktail_categories` ADD CONSTRAINT `cocktail_categories_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `cocktail_tags` ADD CONSTRAINT `cocktail_tags_cocktail_id_fkey` FOREIGN KEY (`cocktail_id`) REFERENCES `cocktails`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `cocktail_tags` ADD CONSTRAINT `cocktail_tags_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `cocktail_recipes` ADD CONSTRAINT `cocktail_recipes_cocktail_id_fkey` FOREIGN KEY (`cocktail_id`) REFERENCES `cocktails`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `cocktail_recipes` ADD CONSTRAINT `cocktail_recipes_ingredient_id_fkey` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `cocktail_images` ADD CONSTRAINT `cocktail_images_cocktail_id_fkey` FOREIGN KEY (`cocktail_id`) REFERENCES `cocktails`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `production_tasks` ADD CONSTRAINT `production_tasks_cocktail_id_fkey` FOREIGN KEY (`cocktail_id`) REFERENCES `cocktails`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `production_tasks` ADD CONSTRAINT `production_tasks_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `production_tasks` ADD CONSTRAINT `production_tasks_assigned_to_user_id_fkey` FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `production_tasks` ADD CONSTRAINT `production_tasks_completed_by_user_id_fkey` FOREIGN KEY (`completed_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `production_task_logs` ADD CONSTRAINT `production_task_logs_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `production_tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `production_task_logs` ADD CONSTRAINT `production_task_logs_operator_user_id_fkey` FOREIGN KEY (`operator_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
