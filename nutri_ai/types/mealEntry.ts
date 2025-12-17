import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { NutritionInfo } from "./nutritionInfo";
import { MS_TO_S } from "../constants/values";
import { MealQuality } from "./mealQuality";

export enum MealCategory {
  Breakfast = "Breakfast",
  Lunch = "Lunch",
  Dinner = "Dinner",
  Snack = "Snack",
  Other = "Other",
}

export interface MealEntry {
  id: string;
  timestamp: number;
  category: MealCategory;
  image?: string;
  audio?: string;
  transcription?: string;
  mealQuality: MealQuality;
  nutritionInfo: NutritionInfo;
}

export function createMealEntry(params: {
  category: MealCategory;
  mealQuality: MealQuality;
  nutritionInfo: NutritionInfo;
  image?: string;
  audio?: string;
  transcription?: string;
  timestamp?: number;
  id?: string;
}): MealEntry {
  return {
    id: params.id || uuidv4(),
    timestamp: params.timestamp || Math.floor(Date.now() / MS_TO_S),
    category: params.category,
    mealQuality: params.mealQuality,
    nutritionInfo: params.nutritionInfo,
    image: params.image,
    audio: params.audio,
    transcription: params.transcription,
  };
}

export function parseMealEntry(json: any): MealEntry {
  const mq = json.mealQuality || json.meal_quality || {};
  const ni = json.nutritionInfo || json.nutrition_info || {};

  return {
    id: json.id,
    timestamp: json.timestamp,
    category: json.category,
    image: json.image,
    audio: json.audio,
    transcription: json.transcription,
    mealQuality: {
      calorieDensity: mq.calorieDensity ?? mq.calorie_density,
      goalFitPercentage: mq.goalFitPercentage ?? mq.goal_fit_percentage,
      mealQualityScore: mq.mealQualityScore ?? mq.meal_quality_score,
    },
    nutritionInfo: {
      calories: ni.calories,
      carbs: ni.carbs,
      sugar: ni.sugar,
      protein: ni.protein,
      fat: ni.fat,
    },
  };
}
