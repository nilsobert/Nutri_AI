import { MealEntry, MealCategory } from "../../types/mealEntry";
import { NutritionInfo } from "../../types/nutritionInfo";
import { mockMeals } from "../../mock-data/meals2";
import { MS_TO_S } from "../../constants/values";

/* Utility: uniform random in range */
export const randomInRange = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/* Utility: random value around a mean (± ratio) */
const randomAround = (mean: number, ratio: number) => {
  const min = Math.max(0, Math.floor(mean * (1 - ratio)));
  const max = Math.ceil(mean * (1 + ratio));
  return randomInRange(min, max);
};

/* Generate a single MealEntry from a template */
export const generateMeal = (
  template: MealEntry,
  timestamp?: number,
): MealEntry => {
  const n = template.getNutritionInfo();

  // Only modify nutrition randomly, keep other fields unchanged
  const newNutrition = new NutritionInfo({
    calories: randomAround(n.getCalories(), 0.1),
    protein: randomAround(n.getProtein(), 0.15),
    carbs: randomAround(n.getCarbs(), 0.15),
    fat: randomAround(n.getFat(), 0.15),
    sugar: randomAround(n.getSugar(), 0.25),
  });

  return new MealEntry(
    template.getCategory(),
    template.getMealQuality(),
    newNutrition,
    template.getImage(),
    template.getTranscription(),
    timestamp,
  );
};

/* Generate meals for the whole year (up to today) */
export const generateYearMeals = (): Record<
  string,
  Partial<Record<MealCategory, MealEntry>>
> => {
  const meals: Record<string, Partial<Record<MealCategory, MealEntry>>> = {};

  const startDate = new Date(2025, 0, 1);
  const today = new Date();

  // Normalize "today" to avoid time-of-day issues
  today.setHours(0, 0, 0, 0);

  const templates = Object.fromEntries(
    mockMeals.map((m) => [m.getCategory(), m]),
  ) as Record<MealCategory, MealEntry>;

  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(d.getDate()).padStart(2, "0")}`;

    const timestamp = Math.floor(d.getTime() / MS_TO_S);

    meals[dateStr] = {
      [MealCategory.Breakfast]: generateMeal(
        templates[MealCategory.Breakfast],
        timestamp,
      ),
      [MealCategory.Lunch]: generateMeal(
        templates[MealCategory.Lunch],
        timestamp,
      ),
      [MealCategory.Snack]: generateMeal(
        templates[MealCategory.Snack],
        timestamp,
      ),
      [MealCategory.Dinner]: generateMeal(
        templates[MealCategory.Dinner],
        timestamp,
      ),
    };
  }

  return meals;
};
