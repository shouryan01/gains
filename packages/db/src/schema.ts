import { integer, real, sqliteTable, text, index, uniqueIndex } from "drizzle-orm/sqlite-core";
const timestamps = () => ({
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  hlc: text("hlc").notNull(),
  deletedAt: integer("deleted_at"),
});
const syncColumns = () => ({
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").notNull(),
  ...timestamps(),
});
// exercises: Seeded from catalog/exercises/*.json (5,632 base exercises) + user custom exercises
export const exercises = sqliteTable(
  "exercises",
  {
    id: text("id").primaryKey(), // '0025' for catalog entries, UUIDv7 for custom exercises
    userId: text("user_id"), // null for built-in catalog, set for custom user exercises
    name: text("name").notNull(),
    bodyPart: text("body_part").notNull(), // waist | upper arms | back | chest | upper legs | shoulders | lower arms | lower legs | neck | full body | cardio
    equipment: text("equipment").notNull(), // barbell | dumbbell | cable | body weight | leverage machine | ...
    target: text("target").notNull(), // pectorals | lats | quads | biceps | triceps | delts | ...
    secondaryMuscles: text("secondary_muscles", { mode: "json" }).$type<string[]>().notNull(),
    category: text("category").notNull(), // strength | calisthenics | mobility | cardio | olympic | stretching | ...
    description: text("description").notNull(),
    instructions: text("instructions", { mode: "json" }).$type<string[]>().notNull(),
    muscleMap: text("muscle_map", { mode: "json" })
      .$type<{
        primaries: string[];
        secondaries: string[];
        weights: Record<string, number>; // 17 anatomical keys weighted 0..1
      }>()
      .notNull(),
    isHold: integer("is_hold", { mode: "boolean" }).default(false).notNull(),
    isPerSide: integer("is_per_side", { mode: "boolean" }).default(false).notNull(),
    needs: text("needs", { mode: "json" }).$type<string[]>(),
    femaleVariantId: text("female_variant_id"),
    customMediaUrl: text("custom_media_url"),
    isCustom: integer("is_custom", { mode: "boolean" }).default(false).notNull(),
    ...timestamps(),
  },
  (t) => [index("exercises_target_idx").on(t.target), index("exercises_name_idx").on(t.name)],
);

// equipment_profiles: Configures available plates, bars, and custom machine stacks
export const equipmentProfiles = sqliteTable("equipment_profiles", {
  ...syncColumns(),
  name: text("name").notNull(), // e.g., 'Commercial Gym', 'Home Garage'
  unit: text("unit").$type<"lb" | "kg">().default("lb").notNull(),
  barWeights: text("bar_weights", { mode: "json" })
    .$type<{
      barbell: number; // default 45 lb / 20 kg
      ezBar: number; // default 25 lb / 10 kg
      trapBar: number; // default 45 lb / 20 kg
      smithMachine: number; // default 15 lb / 7 kg
    }>()
    .notNull(),
  availablePlates: text("available_plates", { mode: "json" }).$type<number[]>().notNull(), // [45, 35, 25, 10, 5, 2.5, 1.25]
  machineStacks: text("machine_stacks", { mode: "json" }).$type<Record<string, number[]>>(), // custom weight steps per exerciseId
  ...timestamps(),
});

export const routines = sqliteTable("routines", {
  ...syncColumns(),
  name: text("name").notNull(), // e.g., 'Push A', 'Upper B'
  folder: text("folder"), // e.g., 'PPL Split', 'Starter Plans'
  notes: text("notes"),
  sortOrder: integer("sort_order").default(0).notNull(),
  estimatedDurationMin: integer("estimated_duration_min"),
  musclePreview: text("muscle_preview", { mode: "json" }).$type<Record<string, number>>(), // Cached muscle weights for mini body-map icon
  ...timestamps(),
});

export const routineExercises = sqliteTable(
  "routine_exercises",
  {
    ...syncColumns(),
    routineId: text("routine_id").notNull(),
    exerciseId: text("exercise_id").notNull(),
    backupExerciseId: text("backup_exercise_id"), // 1-tap swap when machine is taken
    sortOrder: integer("sort_order").notNull(),
    supersetGroupId: text("superset_group_id"), // Exercises sharing this ID run back-to-back in a circuit
    restSeconds: integer("rest_seconds").default(120).notNull(),
    warmupRestSeconds: integer("warmup_rest_seconds").default(60).notNull(),
    notes: text("notes"),
    progressionRule: text("progression_rule", { mode: "json" })
      .$type<{
        type: "linear" | "greyskull" | "double" | "triple" | "time" | "none";
        incrementLb: number; // e.g., 5 or 2.5
        repRangeMin?: number; // e.g., 8
        repRangeMax?: number; // e.g., 12
        setRangeMax?: number; // for triple progression, e.g., 4
        deloadPercent?: number; // default 10%
        stallSessionsThreshold?: number; // default 2
      }>()
      .notNull(),
    templateSets: text("template_sets", { mode: "json" })
      .$type<
        Array<{
          setNumber: number;
          setType: "warmup" | "working" | "dropset" | "rest_pause" | "amrap";
          targetWeightLb?: number;
          targetReps?: number;
          targetDurationSec?: number;
          targetRir?: number;
          restSecondsOverride?: number;
        }>
      >()
      .notNull(),
    ...timestamps(),
  },
  (t) => [index("routine_exercises_parent_idx").on(t.routineId, t.sortOrder)],
);

export const scheduleConfig = sqliteTable("schedule_config", {
  ...syncColumns(),
  mode: text("mode").$type<"weekday" | "rotation">().default("rotation").notNull(),
  weekStartsOn: integer("week_starts_on").default(1).notNull(), // 1 = Monday, 0 = Sunday
  // For weekday mode: maps weekday (0..6) to a list of routine IDs (supports cycling A->B on Upper day)
  weekdayMapping: text("weekday_mapping", { mode: "json" }).$type<Record<number, string[]>>(),
  // For rotation mode: ordered queue of routine IDs [RoutineA, RoutineB, RoutineC]
  rotationQueue: text("rotation_queue", { mode: "json" }).$type<string[]>(),
  currentRotationIndex: integer("current_rotation_index").default(0).notNull(),
  dateOverrides: text("date_overrides", { mode: "json" }).$type<Record<string, string | null>>(), // 'YYYY-MM-DD' -> routineId or null (rest)
  ...timestamps(),
});

export const workouts = sqliteTable(
  "workouts",
  {
    ...syncColumns(),
    routineId: text("routine_id"), // null if Freestyle workout
    name: text("name").notNull(),
    status: text("status").$type<"in_progress" | "completed" | "discarded">().notNull(),
    startedAt: integer("started_at").notNull(),
    completedAt: integer("completed_at"),
    durationSeconds: integer("duration_seconds"),
    bodyweightLb: real("bodyweight_lb"),
    totalVolumeLb: real("total_volume_lb").default(0).notNull(),
    totalSets: integer("total_sets").default(0).notNull(),
    prCount: integer("pr_count").default(0).notNull(),
    notes: text("notes"),
    muscleSummary: text("muscle_summary", { mode: "json" }).$type<Record<string, number>>(), // Fractional effective sets per muscle
    ...timestamps(),
  },
  (t) => [index("workouts_user_started_idx").on(t.userId, t.startedAt)],
);

export const workoutExercises = sqliteTable(
  "workout_exercises",
  {
    ...syncColumns(),
    workoutId: text("workout_id").notNull(),
    exerciseId: text("exercise_id").notNull(),
    swappedFromExerciseId: text("swapped_from_exercise_id"),
    sortOrder: integer("sort_order").notNull(),
    supersetGroupId: text("superset_group_id"),
    restSeconds: integer("rest_seconds").default(120).notNull(),
    notes: text("notes"),
    progressionRecommendation: text("progression_recommendation", { mode: "json" }).$type<{
      nextWeightLb: number;
      nextReps: number;
      reason: string; // e.g., '+5 lb Linear Progression' or '-10% Deload after 2 stalls'
      userOverrideWeightLb?: number;
    }>(),
    ...timestamps(),
  },
  (t) => [index("workout_exercises_parent_idx").on(t.workoutId, t.sortOrder)],
);

export const workoutSets = sqliteTable(
  "workout_sets",
  {
    ...syncColumns(),
    workoutId: text("workout_id").notNull(),
    workoutExerciseId: text("workout_exercise_id").notNull(),
    exerciseId: text("exercise_id").notNull(),
    setNumber: integer("set_number").notNull(),
    setType: text("set_type")
      .$type<"warmup" | "working" | "dropset" | "rest_pause" | "amrap">()
      .default("working")
      .notNull(),
    weightLb: real("weight_lb"), // 0 or null for bodyweight; positive for added load
    reps: integer("reps"),
    leftReps: integer("left_reps"), // for unilateral / per-side exercises
    rightReps: integer("right_reps"),
    durationSeconds: integer("duration_seconds"), // for timed holds/stretches/cardio
    distanceMeters: real("distance_meters"),
    rir: real("rir"), // Reps in Reserve (0..5)
    rpe: real("rpe"), // Rate of Perceived Exertion (5..10)
    estimated1RmLb: real("estimated_1rm_lb"),
    heartRateAvg: integer("heart_rate_avg"), // populated via Apple Watch HealthKit
    isCompleted: integer("is_completed", { mode: "boolean" }).default(false).notNull(),
    completedAt: integer("completed_at"),
    prTypes: text("pr_types", { mode: "json" }).$type<
      Array<"1rm" | "weight" | "volume" | "reps">
    >(),
    ...timestamps(),
  },
  (t) => [
    index("workout_sets_parent_idx").on(t.workoutExerciseId),
    index("workout_sets_exercise_idx").on(t.exerciseId, t.completedAt),
  ],
);

export const bodyMeasurements = sqliteTable(
  "body_measurements",
  {
    ...syncColumns(),
    date: text("date").notNull(), // 'YYYY-MM-DD'
    scaleWeightLb: real("scale_weight_lb"),
    trendWeightLb: real("trend_weight_lb"), // MacroFactor EWMA smoothed weight
    bodyFatPct: real("body_fat_pct"),
    measurementsJson: text("measurements_json", { mode: "json" }).$type<{
      neckIn?: number;
      shouldersIn?: number;
      chestIn?: number;
      waistIn?: number;
      hipsIn?: number;
      leftBicepIn?: number;
      rightBicepIn?: number;
      leftForearmIn?: number;
      rightForearmIn?: number;
      leftThighIn?: number;
      rightThighIn?: number;
      leftCalfIn?: number;
      rightCalfIn?: number;
    }>(),
    notes: text("notes"),
    ...timestamps(),
  },
  (t) => [uniqueIndex("body_measurements_user_date_idx").on(t.userId, t.date)],
);

export const nutritionDays = sqliteTable(
  "nutrition_days",
  {
    ...syncColumns(),
    date: text("date").notNull(), // 'YYYY-MM-DD'
    targetCalories: integer("target_calories").notNull(),
    targetProteinG: integer("target_protein_g").notNull(),
    totalCalories: integer("total_calories").default(0).notNull(),
    totalProteinG: real("total_protein_g").default(0).notNull(),
    isPartial: integer("is_partial", { mode: "boolean" }).default(false).notNull(), // Excludes incomplete days from TDEE calculation
    ...timestamps(),
  },
  (t) => [uniqueIndex("nutrition_days_user_date_idx").on(t.userId, t.date)],
);

export const nutritionEntries = sqliteTable(
  "nutrition_entries",
  {
    ...syncColumns(),
    date: text("date").notNull(), // 'YYYY-MM-DD'
    mealSlot: text("meal_slot").$type<"breakfast" | "lunch" | "dinner" | "snack">().notNull(),
    foodItemId: text("food_item_id"),
    name: text("name").notNull(),
    weightGrams: real("weight_grams"),
    servings: real("servings").default(1).notNull(),
    calories: integer("calories").notNull(),
    proteinG: real("protein_g").notNull(),
    carbsG: real("carbs_g"),
    fatG: real("fat_g"),
    source: text("source")
      .$type<"manual" | "barcode" | "ai_photo" | "ai_text" | "ai_ocr" | "saved_meal">()
      .notNull(),
    aiConfidence: real("ai_confidence"),
    ...timestamps(),
  },
  (t) => [index("nutrition_entries_user_date_idx").on(t.userId, t.date)],
);

// The product spec names these tables without column definitions. These are the
// v0.1 contracts, using the same sync metadata and canonical lb / gram units.
export const personalRecords = sqliteTable(
  "personal_records",
  {
    ...syncColumns(),
    exerciseId: text("exercise_id").notNull(),
    workoutSetId: text("workout_set_id").notNull(),
    type: text("type").$type<"1rm" | "weight" | "volume" | "reps">().notNull(),
    value: real("value").notNull(),
    achievedAt: integer("achieved_at").notNull(),
  },
  (t) => [index("personal_records_exercise_idx").on(t.userId, t.exerciseId)],
);
export const foodItems = sqliteTable(
  "food_items",
  {
    ...syncColumns(),
    name: text("name").notNull(),
    brand: text("brand"),
    barcode: text("barcode"),
    caloriesPer100g: real("calories_per_100g").notNull(),
    proteinPer100g: real("protein_per_100g").notNull(),
    carbsPer100g: real("carbs_per_100g"),
    fatPer100g: real("fat_per_100g"),
    servingSizeGrams: real("serving_size_grams"),
    source: text("source").notNull(),
  },
  (t) => [index("food_items_barcode_idx").on(t.barcode)],
);
export type SavedMealItem = {
  foodItemId?: string;
  name: string;
  weightGrams?: number;
  calories: number;
  proteinG: number;
  carbsG?: number;
  fatG?: number;
};
export const savedMeals = sqliteTable("saved_meals", {
  ...syncColumns(),
  name: text("name").notNull(),
  itemsJson: text("items_json", { mode: "json" }).$type<SavedMealItem[]>().notNull(),
});
export const tdeeSnapshots = sqliteTable(
  "tdee_snapshots",
  {
    ...syncColumns(),
    date: text("date").notNull(),
    expenditureCalories: real("expenditure_calories").notNull(),
    trendWeightLb: real("trend_weight_lb").notNull(),
    averageIntakeCalories: real("average_intake_calories").notNull(),
    validDays: integer("valid_days").notNull(),
    targetCalories: integer("target_calories"),
  },
  (t) => [index("tdee_snapshots_user_date_idx").on(t.userId, t.date)],
);
export const aiProposals = sqliteTable("ai_proposals", {
  ...syncColumns(),
  type: text("type").notNull(),
  status: text("status")
    .$type<"pending" | "approved" | "rejected" | "undone">()
    .default("pending")
    .notNull(),
  beforeSnapshotJson: text("before_snapshot_json", { mode: "json" })
    .$type<Record<string, unknown>>()
    .notNull(),
  afterSnapshotJson: text("after_snapshot_json", { mode: "json" })
    .$type<Record<string, unknown>>()
    .notNull(),
  rationaleMarkdown: text("rationale_markdown").notNull(),
  appliedAt: integer("applied_at"),
  undoneAt: integer("undone_at"),
});
export const progressPhotos = sqliteTable("progress_photos", {
  ...syncColumns(),
  date: text("date").notNull(),
  pose: text("pose").$type<"front" | "side" | "back" | "other">().notNull(),
  scaleWeightLb: real("scale_weight_lb"),
  trendWeightLb: real("trend_weight_lb"),
  bodyFatPct: real("body_fat_pct"),
  notes: text("notes"),
  r2Key: text("r2_key"),
  localBlobKey: text("local_blob_key"),
});
export const syncOutbox = sqliteTable(
  "sync_outbox",
  {
    ...syncColumns(),
    tableName: text("table_name").notNull(),
    recordId: text("record_id").notNull(),
    changedFieldsJson: text("changed_fields_json", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull(),
  },
  (t) => [index("sync_outbox_hlc_idx").on(t.hlc)],
);
export const userSettings = sqliteTable(
  "user_settings",
  {
    ...syncColumns(),
    theme: text("theme").$type<"dark" | "light" | "system">().default("system").notNull(),
    weightUnit: text("weight_unit").$type<"lb" | "kg">().default("lb").notNull(),
    colorPreset: text("color_preset").$type<"factor" | "open">().default("factor").notNull(),
    overviewOrder: text("overview_order", { mode: "json" })
      .$type<Array<"training" | "weight" | "nutrition">>()
      .default(["training", "weight", "nutrition"])
      .notNull(),
    authMode: text("auth_mode").$type<"demo" | "account">().default("demo").notNull(),
  },
  (t) => [uniqueIndex("user_settings_user_idx").on(t.userId)],
);
