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
