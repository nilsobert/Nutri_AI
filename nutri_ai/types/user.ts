// Note: weight-goal (lose/gain/maintain) functionality was removed in favor of using `motivation` only.

// TODO: Add supported medical conditions later on
export enum MedicalCondition {
  None = "None",
}

export enum MotivationToTrackCalories {
  LoseWeight = "LoseWeight",
  GainWeight = "GainWeight",
  GainMuscle = "GainMuscle",
  LeadAHealthyLife = "LeadAHealthyLife",
  TrackMedicalCondition = "TrackMedicalCondition",
  ImproveAthletics = "ImproveAthletics",
}

export enum Gender {
  Male = "Male",
  Female = "Female",
}

export enum ActivityLevel {
  Sedentary = "Sedentary",
  Moderate = "Moderate",
  Active = "Active",
}

export interface User {
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  activityLevel: ActivityLevel;
  medicalCondition: MedicalCondition;
  weightKg: number;
  motivation: MotivationToTrackCalories;
  email: string;
  password: string;

  // Body composition (optional, for more accurate calculations)
  bodyFatPercentage?: number;
  
  // Dietary preferences
  proteinPreference?: "low" | "moderate" | "high"; // Affects macro split

  // Custom goal overrides
  customCalories?: number;
  customProtein?: number;
  customCarbs?: number;
  customFat?: number;
  isCustomGoals?: boolean;
}

export function parseUser(json: any): User {
  return {
    name: json.name,
    age: json.age,
    gender: json.gender ?? Gender.Male,
    heightCm: json.heightCm ?? json.height_cm ?? 175,
    activityLevel: json.activityLevel ?? json.activity_level ?? ActivityLevel.Sedentary,
    medicalCondition: json.medicalCondition ?? json.medical_condition ?? MedicalCondition.None,
    weightKg: json.weightKg ?? json.weight_kg,
    motivation: json.motivation,
    email: json.email,
    password: json.password ?? "",
    bodyFatPercentage: json.bodyFatPercentage ?? json.body_fat_percentage,
    proteinPreference: json.proteinPreference ?? json.protein_preference,
    customCalories: json.customCalories ?? json.custom_calories,
    customProtein: json.customProtein ?? json.custom_protein,
    customCarbs: json.customCarbs ?? json.custom_carbs,
    customFat: json.customFat ?? json.custom_fat,
    isCustomGoals: json.isCustomGoals ?? json.is_custom_goals,
  };
}
