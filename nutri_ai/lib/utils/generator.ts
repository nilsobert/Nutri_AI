import { MealEntry, MealCategory, createMealEntry } from "../../types/mealEntry";
import { NutritionInfo } from "../../types/nutritionInfo";
import { MealQuality } from "../../types/mealQuality";
import { mockMeals } from "../../mock-data/meals";
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
export const generateMeal = (template: MealEntry, timestamp?: number): MealEntry => {
  const ni = template.nutritionInfo;

  // Only modify nutrition randomly, keep other fields unchanged
  const newNutrition: NutritionInfo = {
    calories: randomAround(ni.calories, 0.1),
    protein: randomAround(ni.protein, 0.15),
    carbs: randomAround(ni.carbs, 0.15),
    fat: randomAround(ni.fat, 0.15),
    sugar: randomAround(ni.sugar, 0.25),
  };

  return createMealEntry({
    category: template.category,
    mealQuality: template.mealQuality,
    nutritionInfo: newNutrition,
    image: template.image,
    transcription: template.transcription,
    timestamp: timestamp,
  });
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

  // Create a map of templates by category
  const templates: Record<MealCategory, MealEntry> = {} as Record<MealCategory, MealEntry>;
  
  // Find one template for each category from mockMeals
  for (const meal of mockMeals) {
    if (!templates[meal.category]) {
      templates[meal.category] = meal;
    }
  }

  for (
    let d = new Date(startDate);
    d <= today;
    d.setDate(d.getDate() + 1)
  ) {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;

    const timestamp = Math.floor(d.getTime() / MS_TO_S);

    meals[dateStr] = {
      [MealCategory.Breakfast]: generateMeal(
        templates[MealCategory.Breakfast],
        timestamp
      ),
      [MealCategory.Lunch]: generateMeal(
        templates[MealCategory.Lunch],
        timestamp
      ),
      [MealCategory.Snack]: generateMeal(
        templates[MealCategory.Snack],
        timestamp
      ),
      [MealCategory.Dinner]: generateMeal(
        templates[MealCategory.Dinner],
        timestamp
      ),
    };
  }

  return meals;
};
