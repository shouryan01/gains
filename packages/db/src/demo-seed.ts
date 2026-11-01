import { createClock, localDate, uuidv7 } from "@gains/shared";
import { getTableColumns, getTableName } from "drizzle-orm";
import * as schema from "./schema";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";

export interface Statement {
  sql: string;
  params?: (string | number | null)[];
}
export const tableNames = Object.values(schema).map(getTableName);
export function insertStatement<T extends SQLiteTable>(
  table: T,
  values: T["$inferInsert"],
): Statement {
  const columns = getTableColumns(table);
  const entries = Object.entries(values).filter(
    ([key, value]) => value !== undefined && key in columns,
  );
  return {
    sql: `INSERT INTO "${getTableName(table)}" (${entries.map(([key]) => `"${columns[key]!.name}"`).join(", ")}) VALUES (${entries.map(() => "?").join(", ")})`,
    params: entries.map(
      ([key, value]) => columns[key]!.mapToDriverValue(value) as string | number | null,
    ),
  };
}
/** One transaction replaces demo rows; re-seeding never duplicates or accumulates data. */
export function resetStatements(): Statement[] {
  return tableNames.map((name) => ({ sql: `DELETE FROM "${name}"` }));
}
export function demoStatements(now = new Date()): Statement[] {
  const clock = createClock("demo");
  const meta = () => ({
    id: uuidv7(),
    userId: "demo",
    createdAt: now.getTime(),
    updatedAt: now.getTime(),
    hlc: clock.send(),
  });
  // Settings are preferences, so seeding preserves them. Reset clears everything.
  const statements = tableNames
    .filter((name) => name !== "user_settings")
    .map((name) => ({ sql: `DELETE FROM "${name}"` }) as Statement);
  const add = <T extends SQLiteTable>(table: T, values: T["$inferInsert"]) =>
    statements.push(insertStatement(table, values));
  const samples = [
    ["Barbell bench press", "chest", "barbell", "pectorals", 135],
    ["Incline dumbbell press", "chest", "dumbbell", "pectorals", 45],
    ["Seated shoulder press", "shoulders", "dumbbell", "delts", 35],
    ["Cable lateral raise", "shoulders", "cable", "delts", 15],
    ["Triceps pushdown", "upper arms", "cable", "triceps", 40],
    ["Lat pulldown", "back", "cable", "lats", 100],
    ["Seated cable row", "back", "cable", "upperBack", 90],
    ["Dumbbell curl", "upper arms", "dumbbell", "biceps", 25],
    ["Barbell squat", "upper legs", "barbell", "quads", 185],
    ["Romanian deadlift", "upper legs", "barbell", "hamstrings", 155],
  ] as const;
  const exerciseIds = samples.map((sample) => {
    const id = uuidv7();
    add(schema.exercises, {
      ...meta(),
      id,
      userId: null,
      name: sample[0],
      bodyPart: sample[1],
      equipment: sample[2],
      target: sample[3],
      secondaryMuscles: [],
      category: "strength",
      description: `Sample ${sample[0].toLowerCase()} for the Gains demo.`,
      instructions: [
        "Set up in a stable position.",
        "Move through a comfortable range with control.",
        "Return slowly and repeat.",
      ],
      muscleMap: { primaries: [sample[3]], secondaries: [], weights: { [sample[3]]: 1 } },
    });
    return id;
  });
  const routineIds = ["Push A", "Pull A"].map((name, index) => {
    const id = uuidv7();
    add(schema.routines, {
      ...meta(),
      id,
      name,
      folder: "Push / Pull",
      sortOrder: index,
      estimatedDurationMin: 48 + index * 4,
      notes: "Sample routine · 3 working sets per exercise",
    });
    const indices = index === 0 ? [0, 1, 2, 3, 4] : [5, 6, 7, 8, 9];
    indices.forEach((exerciseIndex, sortOrder) =>
      add(schema.routineExercises, {
        ...meta(),
        routineId: id,
        exerciseId: exerciseIds[exerciseIndex]!,
        sortOrder,
        progressionRule: { type: "double", incrementLb: 5, repRangeMin: 8, repRangeMax: 12 },
        templateSets: [1, 2, 3].map((setNumber) => ({
          setNumber,
          setType: "working" as const,
          targetWeightLb: samples[exerciseIndex]![4],
          targetReps: 10,
          targetRir: 2,
        })),
      }),
    );
    return id;
  });
  add(schema.scheduleConfig, { ...meta(), rotationQueue: routineIds, mode: "rotation" });
  [13, 11, 9, 6, 4, 2].forEach((daysAgo, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(17, 30, 0, 0);
    const id = uuidv7();
    const indices = index % 2 === 0 ? [0, 1, 2, 3, 4] : [5, 6, 7, 8, 9];
    const increment = Math.floor(index / 2) * 5;
    const totalVolumeLb = indices.reduce(
      (sum, i) => sum + (samples[i]![4] + increment) * 10 * 3,
      0,
    );
    add(schema.workouts, {
      ...meta(),
      id,
      routineId: routineIds[index % 2]!,
      name: index % 2 === 0 ? "Push A" : "Pull A",
      status: "completed",
      startedAt: date.getTime(),
      completedAt: date.getTime() + 3000000,
      durationSeconds: 3000,
      totalSets: 15,
      totalVolumeLb,
      bodyweightLb: 178.5,
      prCount: 0,
    });
    indices.forEach((exerciseIndex, sortOrder) => {
      const workoutExerciseId = uuidv7();
      add(schema.workoutExercises, {
        ...meta(),
        id: workoutExerciseId,
        workoutId: id,
        exerciseId: exerciseIds[exerciseIndex]!,
        sortOrder,
      });
      for (let setNumber = 1; setNumber <= 3; setNumber++)
        add(schema.workoutSets, {
          ...meta(),
          workoutId: id,
          workoutExerciseId,
          exerciseId: exerciseIds[exerciseIndex]!,
          setNumber,
          weightLb: samples[exerciseIndex]![4] + increment,
          reps: 10,
          rir: 2,
          isCompleted: true,
          completedAt: date.getTime() + sortOrder * 500000 + setNumber * 120000,
        });
    });
  });
  const meals = [
    {
      name: "Greek yogurt, oats & berries",
      mealSlot: "breakfast",
      calories: 480,
      proteinG: 34,
      carbsG: 62,
      fatG: 11,
    },
    {
      name: "Chicken & rice bowl",
      mealSlot: "lunch",
      calories: 720,
      proteinG: 54,
      carbsG: 86,
      fatG: 18,
    },
    {
      name: "Salmon, potatoes & greens",
      mealSlot: "dinner",
      calories: 760,
      proteinG: 48,
      carbsG: 71,
      fatG: 29,
    },
    {
      name: "Protein shake & banana",
      mealSlot: "snack",
      calories: 300,
      proteinG: 30,
      carbsG: 35,
      fatG: 5,
    },
  ] as const;
  for (let day = 13; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    const dateKey = localDate(date);
    const weight = Math.round((178.2 + day * 0.12 + Math.sin(day * 1.7) * 0.6) * 10) / 10;
    add(schema.bodyMeasurements, {
      ...meta(),
      date: dateKey,
      scaleWeightLb: weight,
      trendWeightLb: Math.round((178.6 + day * 0.11) * 10) / 10,
    });
    const todayMeals = [...meals].slice(0, day === 0 ? 2 : 4);
    add(schema.nutritionDays, {
      ...meta(),
      date: dateKey,
      targetCalories: 2400,
      targetProteinG: 180,
      totalCalories: todayMeals.reduce<number>((sum, meal) => sum + meal.calories, 0),
      totalProteinG: todayMeals.reduce<number>((sum, meal) => sum + meal.proteinG, 0),
      isPartial: day === 0,
    });
    todayMeals.forEach((meal) =>
      add(schema.nutritionEntries, { ...meta(), date: dateKey, ...meal, source: "manual" }),
    );
  }
  return statements;
}
