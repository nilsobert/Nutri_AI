import { 
  ActivityLevel, 
  Gender, 
  IUser, 
  MotivationToTrackCalories,
  WeightGoalType,
  WeightLossRate 
} from "@/types/user";

export interface NutritionGoals {
  calories: number;
  carbs: number; // grams
  protein: number; // grams
  fat: number; // grams
  
  // Additional metrics
  bmr: number; // Basal Metabolic Rate
  tdee: number; // Total Daily Energy Expenditure
  
  // Weight goal information
  estimatedWeeklyWeightChange?: number; // kg per week (negative for loss, positive for gain)
  estimatedTimeToGoal?: number; // weeks
  recommendedCalorieAdjustment?: number; // daily calorie adjustment from maintenance
}

export interface MacroSplit {
  proteinPercent: number;
  fatPercent: number;
  carbsPercent: number;
}

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
 * This is the most accurate formula for most people
 */
export const calculateBMR = (user: IUser): number => {
  let bmr = 10 * user.weightKg + 6.25 * user.heightCm - 5 * user.age;
  
  if (user.gender === Gender.Male) {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  
  return bmr;
};

/**
 * Alternative BMR calculation using Katch-McArdle Formula
 * More accurate if body fat percentage is known
 * BMR = 370 + (21.6 × lean body mass in kg)
 */
export const calculateBMRWithBodyFat = (user: IUser): number => {
  if (!user.bodyFatPercentage) {
    return calculateBMR(user);
  }
  
  const leanBodyMass = user.weightKg * (1 - user.bodyFatPercentage / 100);
  return 370 + (21.6 * leanBodyMass);
};

/**
 * Get activity multiplier based on activity level
 */
export const getActivityMultiplier = (activityLevel: ActivityLevel): number => {
  switch (activityLevel) {
    case ActivityLevel.Sedentary:
      return 1.2; // Little to no exercise
    case ActivityLevel.Moderate:
      return 1.55; // Exercise 3-5 days/week
    case ActivityLevel.Active:
      return 1.725; // Exercise 6-7 days/week or physical job
    default:
      return 1.2;
  }
};

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 */
export const calculateTDEE = (user: IUser): number => {
  const bmr = user.bodyFatPercentage 
    ? calculateBMRWithBodyFat(user) 
    : calculateBMR(user);
  
  const activityMultiplier = getActivityMultiplier(user.activityLevel);
  return bmr * activityMultiplier;
};

/**
 * Get calorie adjustment based on weight loss/gain rate
 * 1 kg of body weight ≈ 7700 calories
 */
export const getCalorieAdjustmentForRate = (
  weightLossRate: WeightLossRate,
  goalType: WeightGoalType
): number => {
  const CALORIES_PER_KG = 7700;
  let weeklyKgChange = 0;
  
  switch (weightLossRate) {
    case WeightLossRate.Slow:
      weeklyKgChange = 0.25; // ~250 cal/day deficit
      break;
    case WeightLossRate.Moderate:
      weeklyKgChange = 0.5; // ~550 cal/day deficit
      break;
    case WeightLossRate.Aggressive:
      weeklyKgChange = 0.75; // ~825 cal/day deficit
      break;
  }
  
  const dailyCalorieChange = (weeklyKgChange * CALORIES_PER_KG) / 7;
  
  // Negative for weight loss, positive for weight gain
  return goalType === WeightGoalType.Lose ? -dailyCalorieChange : dailyCalorieChange;
};

/**
 * Determine macro split based on user goals and preferences
 */
export const getMacroSplit = (user: IUser): MacroSplit => {
  const motivation = user.motivation;
  const proteinPref = user.proteinPreference || "moderate";
  
  // Base splits for different goals
  let proteinPercent = 0.25; // 25% default
  let fatPercent = 0.30; // 30% default
  let carbsPercent = 0.45; // 45% default
  
  switch (motivation) {
    case MotivationToTrackCalories.LoseWeight:
      // Higher protein to preserve muscle during deficit
      proteinPercent = 0.30;
      fatPercent = 0.25;
      carbsPercent = 0.45;
      break;
      
    case MotivationToTrackCalories.GainMuscle:
      // High protein for muscle building
      proteinPercent = 0.30;
      fatPercent = 0.25;
      carbsPercent = 0.45;
      break;
      
    case MotivationToTrackCalories.GainWeight:
      // Balanced with slightly higher carbs for energy
      proteinPercent = 0.25;
      fatPercent = 0.25;
      carbsPercent = 0.50;
      break;
      
    case MotivationToTrackCalories.ImproveAthletics:
      // Higher carbs for performance
      proteinPercent = 0.25;
      fatPercent = 0.25;
      carbsPercent = 0.50;
      break;
      
    case MotivationToTrackCalories.LeadAHealthyLife:
    case MotivationToTrackCalories.TrackMedicalCondition:
    default:
      // Balanced approach
      proteinPercent = 0.25;
      fatPercent = 0.30;
      carbsPercent = 0.45;
      break;
  }
  
  // Adjust based on protein preference
  if (proteinPref === "high") {
    proteinPercent += 0.05;
    carbsPercent -= 0.05;
  } else if (proteinPref === "low") {
    proteinPercent -= 0.05;
    carbsPercent += 0.05;
  }
  
  // Ensure percentages add up to 1
  const total = proteinPercent + fatPercent + carbsPercent;
  proteinPercent /= total;
  fatPercent /= total;
  carbsPercent /= total;
  
  return { proteinPercent, fatPercent, carbsPercent };
};

/**
 * Calculate recommended protein intake based on body weight and goals
 * Returns grams of protein per day
 */
export const calculateProteinTarget = (user: IUser, calories: number): number => {
  // Protein recommendations (g/kg body weight)
  let proteinPerKg = 1.6; // Default for muscle building/active individuals
  
  switch (user.motivation) {
    case MotivationToTrackCalories.LoseWeight:
      // Higher protein during deficit to preserve muscle (2.0-2.4 g/kg)
      proteinPerKg = 2.0;
      break;
      
    case MotivationToTrackCalories.GainMuscle:
      // Muscle building (1.6-2.2 g/kg)
      proteinPerKg = 1.8;
      break;
      
    case MotivationToTrackCalories.ImproveAthletics:
      // Athletic performance (1.4-2.0 g/kg)
      proteinPerKg = 1.6;
      break;
      
    case MotivationToTrackCalories.LeadAHealthyLife:
    case MotivationToTrackCalories.TrackMedicalCondition:
    default:
      // General health (0.8-1.2 g/kg)
      proteinPerKg = 1.0;
      break;
  }
  
  // Calculate based on body weight
  let proteinGrams = user.weightKg * proteinPerKg;
  
  // If body fat percentage is known, use lean body mass for more accuracy
  if (user.bodyFatPercentage) {
    const leanBodyMass = user.weightKg * (1 - user.bodyFatPercentage / 100);
    proteinGrams = leanBodyMass * proteinPerKg;
  }
  
  // Ensure protein doesn't exceed reasonable limits based on calories
  const maxProteinFromCalories = (calories * 0.40) / 4; // Max 40% of calories
  const minProteinFromCalories = (calories * 0.15) / 4; // Min 15% of calories
  
  return Math.round(Math.max(minProteinFromCalories, Math.min(proteinGrams, maxProteinFromCalories)));
};

/**
 * Calculate estimated time to reach weight goal
 */
export const calculateTimeToGoal = (
  currentWeight: number,
  targetWeight: number,
  weeklyWeightChange: number
): number | undefined => {
  if (!targetWeight || weeklyWeightChange === 0) {
    return undefined;
  }
  
  const weightDifference = Math.abs(targetWeight - currentWeight);
  const weeksToGoal = weightDifference / Math.abs(weeklyWeightChange);
  
  return Math.round(weeksToGoal);
};

/**
 * Main function to calculate comprehensive nutrition goals
 */
export const calculateGoals = (user: IUser): NutritionGoals => {
  // Calculate BMR and TDEE
  const bmr = user.bodyFatPercentage 
    ? calculateBMRWithBodyFat(user) 
    : calculateBMR(user);
  
  const tdee = calculateTDEE(user);
  
  // Determine calorie target based on goals
  let targetCalories = tdee;
  let calorieAdjustment = 0;
  let weeklyWeightChange = 0;
  
  // If user has specific weight goals with rate
  if (user.weightGoalType && user.weightLossRate) {
    calorieAdjustment = getCalorieAdjustmentForRate(
      user.weightLossRate,
      user.weightGoalType
    );
    targetCalories += calorieAdjustment;
    
    // Calculate weekly weight change
    const CALORIES_PER_KG = 7700;
    weeklyWeightChange = (calorieAdjustment * 7) / CALORIES_PER_KG;
  } 
  // Fallback to motivation-based adjustments
  else {
    switch (user.motivation) {
      case MotivationToTrackCalories.LoseWeight:
        calorieAdjustment = -500; // Moderate deficit
        targetCalories -= 500;
        weeklyWeightChange = -0.5;
        break;
        
      case MotivationToTrackCalories.GainWeight:
      case MotivationToTrackCalories.GainMuscle:
        calorieAdjustment = 300; // Moderate surplus
        targetCalories += 300;
        weeklyWeightChange = 0.25;
        break;
        
      case MotivationToTrackCalories.ImproveAthletics:
        // Slight surplus for performance
        calorieAdjustment = 200;
        targetCalories += 200;
        weeklyWeightChange = 0.15;
        break;
        
      case MotivationToTrackCalories.LeadAHealthyLife:
      case MotivationToTrackCalories.TrackMedicalCondition:
      default:
        // Maintenance
        calorieAdjustment = 0;
        weeklyWeightChange = 0;
        break;
    }
  }
  
  // Apply safety limits
  const minCalories = user.gender === Gender.Male ? 1500 : 1200;
  const maxCalories = tdee * 1.5; // Don't exceed 150% of TDEE
  
  const calories = Math.round(
    Math.max(minCalories, Math.min(targetCalories, maxCalories))
  );
  
  // Calculate macronutrients
  const macroSplit = getMacroSplit(user);
  
  // Calculate protein with special consideration
  const protein = calculateProteinTarget(user, calories);
  
  // Calculate remaining calories for fat and carbs
  const proteinCalories = protein * 4;
  const remainingCalories = calories - proteinCalories;
  
  // Distribute remaining calories between fat and carbs
  const fatRatio = macroSplit.fatPercent / (macroSplit.fatPercent + macroSplit.carbsPercent);
  const carbsRatio = macroSplit.carbsPercent / (macroSplit.fatPercent + macroSplit.carbsPercent);
  
  const fat = Math.round((remainingCalories * fatRatio) / 9);
  const carbs = Math.round((remainingCalories * carbsRatio) / 4);
  
  
  // Calculate time to goal if applicable
  const timeToGoal = user.targetWeightKg 
    ? calculateTimeToGoal(user.weightKg, user.targetWeightKg, Math.abs(weeklyWeightChange))
    : undefined;
  
  return {
    calories,
    protein,
    fat,
    carbs,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    estimatedWeeklyWeightChange: weeklyWeightChange,
    estimatedTimeToGoal: timeToGoal,
    recommendedCalorieAdjustment: calorieAdjustment,
  };
};

/**
 * Helper function to get a summary of the user's goals
 */
export const getGoalSummary = (user: IUser, goals: NutritionGoals): string => {
  const parts: string[] = [];
  
  parts.push(`Daily Calorie Target: ${goals.calories} kcal`);
  parts.push(`BMR: ${goals.bmr} kcal | TDEE: ${goals.tdee} kcal`);
  
  if (goals.recommendedCalorieAdjustment && goals.recommendedCalorieAdjustment !== 0) {
    const adjustment = goals.recommendedCalorieAdjustment > 0 ? "surplus" : "deficit";
    parts.push(`Calorie ${adjustment}: ${Math.abs(goals.recommendedCalorieAdjustment)} kcal/day`);
  }
  
  if (goals.estimatedWeeklyWeightChange) {
    const direction = goals.estimatedWeeklyWeightChange > 0 ? "gain" : "loss";
    parts.push(`Estimated weekly weight ${direction}: ${Math.abs(goals.estimatedWeeklyWeightChange).toFixed(2)} kg`);
  }
  
  if (user.targetWeightKg && goals.estimatedTimeToGoal) {
    parts.push(`Estimated time to reach ${user.targetWeightKg} kg: ${goals.estimatedTimeToGoal} weeks`);
  }
  
  parts.push(`\nMacros: ${goals.protein}g protein | ${goals.carbs}g carbs | ${goals.fat}g fat`);
  
  return parts.join("\n");
};

/**
 * Validate if user's goals are realistic and safe
 */
export const validateGoals = (user: IUser): { valid: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  
  // Check if target weight is realistic
  if (user.targetWeightKg) {
    const weightDifference = Math.abs(user.targetWeightKg - user.weightKg);
    const bmi = user.weightKg / Math.pow(user.heightCm / 100, 2);
    const targetBMI = user.targetWeightKg / Math.pow(user.heightCm / 100, 2);
    
    if (targetBMI < 16) {
      warnings.push("Target weight results in severely underweight BMI. Please consult a healthcare professional.");
    }
    
    if (targetBMI > 40) {
      warnings.push("Target weight results in very high BMI. Consider setting intermediate goals.");
    }
    
    if (weightDifference > 30) {
      warnings.push("Large weight change goal detected. Consider breaking this into smaller, achievable milestones.");
    }
  }
  
  // Check if weight loss rate is too aggressive
  if (user.weightGoalType === WeightGoalType.Lose && user.weightLossRate === WeightLossRate.Aggressive) {
    const bmi = user.weightKg / Math.pow(user.heightCm / 100, 2);
    if (bmi < 25) {
      warnings.push("Aggressive weight loss rate not recommended for individuals with BMI < 25.");
    }
  }
  
  return {
    valid: warnings.length === 0,
    warnings
  };
};
