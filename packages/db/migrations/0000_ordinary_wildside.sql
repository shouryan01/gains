CREATE TABLE IF NOT EXISTS `ai_proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`hlc` text NOT NULL,
	`deleted_at` integer,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`before_snapshot_json` text NOT NULL,
	`after_snapshot_json` text NOT NULL,
	`rationale_markdown` text NOT NULL,
	`applied_at` integer,
	`undone_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `body_measurements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`hlc` text NOT NULL,
	`deleted_at` integer,
	`date` text NOT NULL,
	`scale_weight_lb` real,
	`trend_weight_lb` real,
	`body_fat_pct` real,
	`measurements_json` text,
	`notes` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `body_measurements_user_date_idx` ON `body_measurements` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `equipment_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`hlc` text NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`unit` text DEFAULT 'lb' NOT NULL,
	`bar_weights` text NOT NULL,
	`available_plates` text NOT NULL,
	`machine_stacks` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`body_part` text NOT NULL,
	`equipment` text NOT NULL,
	`target` text NOT NULL,
	`secondary_muscles` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`instructions` text NOT NULL,
	`muscle_map` text NOT NULL,
	`is_hold` integer DEFAULT false NOT NULL,
	`is_per_side` integer DEFAULT false NOT NULL,
	`needs` text,
	`female_variant_id` text,
	`custom_media_url` text,
	`is_custom` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`hlc` text NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `exercises_target_idx` ON `exercises` (`target`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `exercises_name_idx` ON `exercises` (`name`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `food_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`hlc` text NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`brand` text,
	`barcode` text,
	`calories_per_100g` real NOT NULL,
	`protein_per_100g` real NOT NULL,
	`carbs_per_100g` real,
	`fat_per_100g` real,
	`serving_size_grams` real,
	`source` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `food_items_barcode_idx` ON `food_items` (`barcode`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `nutrition_days` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`hlc` text NOT NULL,
	`deleted_at` integer,
	`date` text NOT NULL,
	`target_calories` integer NOT NULL,
	`target_protein_g` integer NOT NULL,
	`total_calories` integer DEFAULT 0 NOT NULL,
	`total_protein_g` real DEFAULT 0 NOT NULL,
	`is_partial` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `nutrition_days_user_date_idx` ON `nutrition_days` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `nutrition_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`hlc` text NOT NULL,
	`deleted_at` integer,
	`date` text NOT NULL,
	`meal_slot` text NOT NULL,
	`food_item_id` text,
	`name` text NOT NULL,
	`weight_grams` real,
	`servings` real DEFAULT 1 NOT NULL,
	`calories` integer NOT NULL,
	`protein_g` real NOT NULL,
	`carbs_g` real,
	`fat_g` real,
	`source` text NOT NULL,
	`ai_confidence` real
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `nutrition_entries_user_date_idx` ON `nutrition_entries` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `personal_records` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`hlc` text NOT NULL,
	`deleted_at` integer,
	`exercise_id` text NOT NULL,
	`workout_set_id` text NOT NULL,
	`type` text NOT NULL,
	`value` real NOT NULL,
	`achieved_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `personal_records_exercise_idx` ON `personal_records` (`user_id`,`exercise_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `progress_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`hlc` text NOT NULL,
	`deleted_at` integer,
	`date` text NOT NULL,
	`pose` text NOT NULL,
	`scale_weight_lb` real,
	`trend_weight_lb` real,
	`body_fat_pct` real,
	`notes` text,
	`r2_key` text,
	`local_blob_key` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `routine_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`hlc` text NOT NULL,
	`deleted_at` integer,
	`routine_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`backup_exercise_id` text,
	`sort_order` integer NOT NULL,
	`superset_group_id` text,
	`rest_seconds` integer DEFAULT 120 NOT NULL,
	`warmup_rest_seconds` integer DEFAULT 60 NOT NULL,
	`notes` text,
	`progression_rule` text NOT NULL,
	`template_sets` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `routine_exercises_parent_idx` ON `routine_exercises` (`routine_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `routines` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`hlc` text NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`folder` text,
	`notes` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`estimated_duration_min` integer,
	`muscle_preview` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `saved_meals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`hlc` text NOT NULL,
	`deleted_at` integer,
	`name` text NOT NULL,
	`items_json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `schedule_config` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`hlc` text NOT NULL,
	`deleted_at` integer,
	`mode` text DEFAULT 'rotation' NOT NULL,
	`week_starts_on` integer DEFAULT 1 NOT NULL,
	`weekday_mapping` text,
	`rotation_queue` text,
	`current_rotation_index` integer DEFAULT 0 NOT NULL,
	`date_overrides` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sync_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`hlc` text NOT NULL,
	`deleted_at` integer,
	`table_name` text NOT NULL,
	`record_id` text NOT NULL,
	`changed_fields_json` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sync_outbox_hlc_idx` ON `sync_outbox` (`hlc`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `tdee_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`hlc` text NOT NULL,
	`deleted_at` integer,
	`date` text NOT NULL,
	`expenditure_calories` real NOT NULL,
	`trend_weight_lb` real NOT NULL,
	`average_intake_calories` real NOT NULL,
	`valid_days` integer NOT NULL,
	`target_calories` integer
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `tdee_snapshots_user_date_idx` ON `tdee_snapshots` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`hlc` text NOT NULL,
	`deleted_at` integer,
	`theme` text DEFAULT 'system' NOT NULL,
	`weight_unit` text DEFAULT 'lb' NOT NULL,
	`auth_mode` text DEFAULT 'demo' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `user_settings_user_idx` ON `user_settings` (`user_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `workout_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`hlc` text NOT NULL,
	`deleted_at` integer,
	`workout_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`swapped_from_exercise_id` text,
	`sort_order` integer NOT NULL,
	`superset_group_id` text,
	`rest_seconds` integer DEFAULT 120 NOT NULL,
	`notes` text,
	`progression_recommendation` text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `workout_exercises_parent_idx` ON `workout_exercises` (`workout_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `workout_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`hlc` text NOT NULL,
	`deleted_at` integer,
	`workout_id` text NOT NULL,
	`workout_exercise_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`set_number` integer NOT NULL,
	`set_type` text DEFAULT 'working' NOT NULL,
	`weight_lb` real,
	`reps` integer,
	`left_reps` integer,
	`right_reps` integer,
	`duration_seconds` integer,
	`distance_meters` real,
	`rir` real,
	`rpe` real,
	`estimated_1rm_lb` real,
	`heart_rate_avg` integer,
	`is_completed` integer DEFAULT false NOT NULL,
	`completed_at` integer,
	`pr_types` text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `workout_sets_parent_idx` ON `workout_sets` (`workout_exercise_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `workout_sets_exercise_idx` ON `workout_sets` (`exercise_id`,`completed_at`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `workouts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`hlc` text NOT NULL,
	`deleted_at` integer,
	`routine_id` text,
	`name` text NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`duration_seconds` integer,
	`bodyweight_lb` real,
	`total_volume_lb` real DEFAULT 0 NOT NULL,
	`total_sets` integer DEFAULT 0 NOT NULL,
	`pr_count` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`muscle_summary` text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `workouts_user_started_idx` ON `workouts` (`user_id`,`started_at`);
--> statement-breakpoint
CREATE VIRTUAL TABLE IF NOT EXISTS exercises_fts USING fts5(id UNINDEXED, name, target, body_part, equipment, category, description, content='exercises', content_rowid='rowid', tokenize='porter unicode61');
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS exercises_fts_insert AFTER INSERT ON exercises BEGIN
  INSERT INTO exercises_fts(rowid, id, name, target, body_part, equipment, category, description) VALUES (new.rowid, new.id, new.name, new.target, new.body_part, new.equipment, new.category, new.description);
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS exercises_fts_delete AFTER DELETE ON exercises BEGIN
  INSERT INTO exercises_fts(exercises_fts, rowid, id, name, target, body_part, equipment, category, description) VALUES ('delete', old.rowid, old.id, old.name, old.target, old.body_part, old.equipment, old.category, old.description);
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS exercises_fts_update AFTER UPDATE ON exercises BEGIN
  INSERT INTO exercises_fts(exercises_fts, rowid, id, name, target, body_part, equipment, category, description) VALUES ('delete', old.rowid, old.id, old.name, old.target, old.body_part, old.equipment, old.category, old.description);
  INSERT INTO exercises_fts(rowid, id, name, target, body_part, equipment, category, description) VALUES (new.rowid, new.id, new.name, new.target, new.body_part, new.equipment, new.category, new.description);
END;
