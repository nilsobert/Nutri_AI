// meals_2.ts
export type MealProfile = {
  calories: [number, number];
  protein: [number, number];
  carbs: [number, number];
  fat: [number, number];
};

export type MealTypes = {
  breakfast: MealProfile;
  lunch: MealProfile;
  snack: MealProfile;
  dinner: MealProfile;
};

export const mealTypes: MealTypes = {
  breakfast: {
    calories: [250, 400],
    protein: [10, 25],
    carbs: [30, 60],
    fat: [5, 20],
  },
  lunch: {
    calories: [500, 800],
    protein: [20, 40],
    carbs: [50, 100],
    fat: [15, 35],
  },
  snack: {
    calories: [100, 250],
    protein: [5, 12],
    carbs: [10, 30],
    fat: [3, 15],
  },
  dinner: {
    calories: [500, 850],
    protein: [20, 45],
    carbs: [40, 90],
    fat: [15, 35],
  },
};

// Utility to generate a random number in a range
export const randomInRange = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Generate a single meal's nutrition
export const generateMeal = (profile: MealProfile) => ({
  calories: randomInRange(profile.calories[0], profile.calories[1]),
  protein: randomInRange(profile.protein[0], profile.protein[1]),
  carbs: randomInRange(profile.carbs[0], profile.carbs[1]),
  fat: randomInRange(profile.fat[0], profile.fat[1]),
});

// Generate meals for the whole year
export const generateYearMeals = () => {
  const meals: Record<
    string,
    Record<keyof MealTypes, ReturnType<typeof generateMeal>>
  > = {};
  const startDate = new Date(2025, 0, 1); // January 1, 2025
  const endDate = new Date(2025, 11, 31); // December 31, 2025

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // Use local date string
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    meals[dateStr] = {
      breakfast: generateMeal(mealTypes.breakfast),
      lunch: generateMeal(mealTypes.lunch),
      snack: generateMeal(mealTypes.snack),
      dinner: generateMeal(mealTypes.dinner),
    };
  }

  return meals;
};
