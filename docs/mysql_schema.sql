-- Cocktail Database schema
-- Target: MySQL 8.0+

CREATE DATABASE IF NOT EXISTS `cocktail_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `cocktail_db`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(32) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `is_system` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_roles_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `role_id` BIGINT UNSIGNED NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `last_login_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`),
  KEY `idx_users_role_id` (`role_id`),
  KEY `idx_users_status` (`status`),
  CONSTRAINT `fk_users_role_id`
    FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(150) DEFAULT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_categories_name` (`name`),
  UNIQUE KEY `uk_categories_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tags` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `slug` VARCHAR(100) DEFAULT NULL,
  `color` VARCHAR(20) DEFAULT NULL,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tags_name` (`name`),
  UNIQUE KEY `uk_tags_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ingredients` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `abv` DECIMAL(5,2) DEFAULT NULL,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ingredients_name` (`name`),
  KEY `idx_ingredients_category` (`category`),
  KEY `idx_ingredients_is_enabled` (`is_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cocktails` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name_zh` VARCHAR(100) NOT NULL,
  `name_en` VARCHAR(100) DEFAULT NULL,
  `slug` VARCHAR(150) DEFAULT NULL,
  `short_description` VARCHAR(500) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `base_spirit` VARCHAR(100) DEFAULT NULL,
  `abv_note` VARCHAR(50) DEFAULT NULL,
  `glass_type` VARCHAR(100) DEFAULT NULL,
  `taste_profile` VARCHAR(255) DEFAULT NULL,
  `garnish` VARCHAR(255) DEFAULT NULL,
  `method` TEXT DEFAULT NULL,
  `scene` VARCHAR(255) DEFAULT NULL,
  `cover_image_url` VARCHAR(500) DEFAULT NULL,
  `publish_status` VARCHAR(20) NOT NULL DEFAULT 'draft',
  `is_visible` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_by` BIGINT UNSIGNED DEFAULT NULL,
  `updated_by` BIGINT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cocktails_slug` (`slug`),
  KEY `idx_cocktails_name_zh` (`name_zh`),
  KEY `idx_cocktails_publish_status` (`publish_status`),
  KEY `idx_cocktails_is_visible` (`is_visible`),
  KEY `idx_cocktails_sort_order` (`sort_order`),
  KEY `idx_cocktails_created_by` (`created_by`),
  KEY `idx_cocktails_updated_by` (`updated_by`),
  CONSTRAINT `fk_cocktails_created_by`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_cocktails_updated_by`
    FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cocktail_categories` (
  `cocktail_id` BIGINT UNSIGNED NOT NULL,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cocktail_id`, `category_id`),
  KEY `idx_cocktail_categories_category_id` (`category_id`),
  CONSTRAINT `fk_cocktail_categories_cocktail_id`
    FOREIGN KEY (`cocktail_id`) REFERENCES `cocktails` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_cocktail_categories_category_id`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cocktail_tags` (
  `cocktail_id` BIGINT UNSIGNED NOT NULL,
  `tag_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cocktail_id`, `tag_id`),
  KEY `idx_cocktail_tags_tag_id` (`tag_id`),
  CONSTRAINT `fk_cocktail_tags_cocktail_id`
    FOREIGN KEY (`cocktail_id`) REFERENCES `cocktails` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_cocktail_tags_tag_id`
    FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cocktail_recipes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cocktail_id` BIGINT UNSIGNED NOT NULL,
  `ingredient_id` BIGINT UNSIGNED NOT NULL,
  `ingredient_name_snapshot` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(10,2) DEFAULT NULL,
  `unit` VARCHAR(20) DEFAULT NULL,
  `note` VARCHAR(255) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cocktail_recipes_cocktail_id` (`cocktail_id`),
  KEY `idx_cocktail_recipes_ingredient_id` (`ingredient_id`),
  KEY `idx_cocktail_recipes_sort_order` (`cocktail_id`, `sort_order`),
  CONSTRAINT `fk_cocktail_recipes_cocktail_id`
    FOREIGN KEY (`cocktail_id`) REFERENCES `cocktails` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_cocktail_recipes_ingredient_id`
    FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cocktail_images` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cocktail_id` BIGINT UNSIGNED NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `image_type` VARCHAR(20) NOT NULL DEFAULT 'detail',
  `alt_text` VARCHAR(255) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cocktail_images_cocktail_id` (`cocktail_id`),
  KEY `idx_cocktail_images_type` (`image_type`),
  CONSTRAINT `fk_cocktail_images_cocktail_id`
    FOREIGN KEY (`cocktail_id`) REFERENCES `cocktails` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `production_tasks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `task_no` VARCHAR(32) NOT NULL,
  `cocktail_id` BIGINT UNSIGNED NOT NULL,
  `cocktail_name_snapshot` VARCHAR(100) NOT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `remark` VARCHAR(500) DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
  `priority` TINYINT UNSIGNED NOT NULL DEFAULT 3,
  `created_by_user_id` BIGINT UNSIGNED NOT NULL,
  `assigned_to_user_id` BIGINT UNSIGNED DEFAULT NULL,
  `started_at` DATETIME DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  `completed_by_user_id` BIGINT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_production_tasks_task_no` (`task_no`),
  KEY `idx_production_tasks_status` (`status`),
  KEY `idx_production_tasks_created_by` (`created_by_user_id`),
  KEY `idx_production_tasks_assigned_to` (`assigned_to_user_id`),
  KEY `idx_production_tasks_completed_by` (`completed_by_user_id`),
  KEY `idx_production_tasks_created_at` (`created_at`),
  KEY `idx_production_tasks_status_created_at` (`status`, `created_at`),
  CONSTRAINT `fk_production_tasks_cocktail_id`
    FOREIGN KEY (`cocktail_id`) REFERENCES `cocktails` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_production_tasks_created_by_user_id`
    FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_production_tasks_assigned_to_user_id`
    FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_production_tasks_completed_by_user_id`
    FOREIGN KEY (`completed_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `production_task_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `task_id` BIGINT UNSIGNED NOT NULL,
  `action_type` VARCHAR(30) NOT NULL,
  `from_status` VARCHAR(20) DEFAULT NULL,
  `to_status` VARCHAR(20) DEFAULT NULL,
  `operator_user_id` BIGINT UNSIGNED NOT NULL,
  `action_note` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_task_logs_task_id` (`task_id`),
  KEY `idx_task_logs_operator_user_id` (`operator_user_id`),
  KEY `idx_task_logs_created_at` (`created_at`),
  CONSTRAINT `fk_production_task_logs_task_id`
    FOREIGN KEY (`task_id`) REFERENCES `production_tasks` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_production_task_logs_operator_user_id`
    FOREIGN KEY (`operator_user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO `roles` (`code`, `name`, `description`, `is_system`, `sort_order`)
VALUES
  ('admin', '管理员', '可访问后台管理端和前台业务端', 1, 1),
  ('staff', '服务员', '可访问前台业务端并处理待制作任务', 1, 2),
  ('customer', '客户', '预留给未来客户登录功能', 1, 3)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `sort_order` = VALUES(`sort_order`);

INSERT INTO `categories` (`name`, `slug`, `description`, `is_enabled`, `sort_order`)
VALUES
  ('经典鸡尾酒', 'classic-cocktails', '经典配方与常见酒单', 1, 1),
  ('酸味鸡尾酒', 'sour-cocktails', '以酸甜平衡为特点的鸡尾酒', 1, 2),
  ('无酒精鸡尾酒', 'mocktails', '不含酒精的饮品选择', 1, 3),
  ('餐后鸡尾酒', 'after-dinner-cocktails', '适合餐后饮用的风味酒款', 1, 4)
ON DUPLICATE KEY UPDATE
  `description` = VALUES(`description`),
  `is_enabled` = VALUES(`is_enabled`),
  `sort_order` = VALUES(`sort_order`);

INSERT INTO `tags` (`name`, `slug`, `color`, `is_enabled`, `sort_order`)
VALUES
  ('清爽', 'fresh', '#38BDF8', 1, 1),
  ('浓烈', 'strong', '#F97316', 1, 2),
  ('甜', 'sweet', '#FB7185', 1, 3),
  ('酸', 'sour', '#FACC15', 1, 4),
  ('苦', 'bitter', '#64748B', 1, 5)
ON DUPLICATE KEY UPDATE
  `color` = VALUES(`color`),
  `is_enabled` = VALUES(`is_enabled`),
  `sort_order` = VALUES(`sort_order`);

INSERT INTO `ingredients` (`name`, `category`, `description`, `abv`, `is_enabled`, `sort_order`)
VALUES
  ('Gin', 'base_spirit', '杜松子风味烈酒', 40.00, 1, 1),
  ('Rum', 'base_spirit', '甘蔗蒸馏酒', 40.00, 1, 2),
  ('Vodka', 'base_spirit', '中性烈酒', 40.00, 1, 3),
  ('Tequila', 'base_spirit', '龙舌兰烈酒', 40.00, 1, 4),
  ('Lemon Juice', 'juice', '新鲜柠檬汁', NULL, 1, 5),
  ('Simple Syrup', 'syrup', '基础糖浆', NULL, 1, 6),
  ('Angostura Bitters', 'bitter', '安格式苦精', 44.70, 1, 7)
ON DUPLICATE KEY UPDATE
  `category` = VALUES(`category`),
  `description` = VALUES(`description`),
  `abv` = VALUES(`abv`),
  `is_enabled` = VALUES(`is_enabled`),
  `sort_order` = VALUES(`sort_order`);

