import { validateNonNegative } from "@/lib/utils/validation";
import log from "../lib/logger";

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

export enum WeightGoalType {
  Lose = "Lose",
  Gain = "Gain",
  Maintain = "Maintain",
}

export enum WeightLossRate {
  Slow = "Slow", // 0.25 kg/week (~0.5 lbs/week)
  Moderate = "Moderate", // 0.5 kg/week (~1 lb/week)
  Aggressive = "Aggressive", // 0.75-1 kg/week (~1.5-2 lbs/week)
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

export interface IUser {
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

  // Weight goal tracking
  targetWeightKg?: number;
  weightGoalType?: WeightGoalType;
  weightLossRate?: WeightLossRate;
  targetDate?: Date; // When user wants to reach their goal

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

export class User implements IUser {
  private _name: string;
  private _age: number;
  private _gender: Gender;
  private _heightCm: number;
  private _activityLevel: ActivityLevel;
  private _medicalCondition: MedicalCondition;
  private _weightKg: number;
  private _motivation: MotivationToTrackCalories;
  private _email: string;
  private _password: string;

  // Weight goal tracking
  private _targetWeightKg?: number;
  private _weightGoalType?: WeightGoalType;
  private _weightLossRate?: WeightLossRate;
  private _targetDate?: Date;

  // Body composition
  private _bodyFatPercentage?: number;

  // Dietary preferences
  private _proteinPreference?: "low" | "moderate" | "high";

  // Custom goal overrides
  private _customCalories?: number;
  private _customProtein?: number;
  private _customCarbs?: number;
  private _customFat?: number;
  private _isCustomGoals?: boolean;

  constructor(params: {
    name: string;
    age: number;
    gender: Gender;
    heightCm: number;
    activityLevel: ActivityLevel;
    weightKg: number;
    motivation: MotivationToTrackCalories;
    email: string;
    password: string;
    medicalCondition: MedicalCondition;
    targetWeightKg?: number;
    weightGoalType?: WeightGoalType;
    weightLossRate?: WeightLossRate;
    targetDate?: Date;
    bodyFatPercentage?: number;
    proteinPreference?: "low" | "moderate" | "high";
    customCalories?: number;
    customProtein?: number;
    customCarbs?: number;
    customFat?: number;
    isCustomGoals?: boolean;
  }) {
    validateNonNegative("age", params.age);
    validateNonNegative("weightKg", params.weightKg);
    validateNonNegative("heightCm", params.heightCm);

    this._name = params.name;
    this._age = params.age;
    this._gender = params.gender;
    this._heightCm = params.heightCm;
    this._activityLevel = params.activityLevel;
    this._weightKg = params.weightKg;
    this._motivation = params.motivation;
    this._email = params.email;
    this._password = params.password;
    this._medicalCondition = params.medicalCondition ?? MedicalCondition.None;

    // Optional weight goal parameters
    this._targetWeightKg = params.targetWeightKg;
    this._weightGoalType = params.weightGoalType;
    this._weightLossRate = params.weightLossRate;
    this._targetDate = params.targetDate;
    this._bodyFatPercentage = params.bodyFatPercentage;
    this._proteinPreference = params.proteinPreference;
    this._customCalories = params.customCalories;
    this._customProtein = params.customProtein;
    this._customCarbs = params.customCarbs;
    this._customFat = params.customFat;
    this._isCustomGoals = params.isCustomGoals;
  }

  /**
   * Getters and Setters
   */
  public get name(): string {
    return this._name;
  }
  public set name(name: string) {
    this._name = name;
  }

  public get age(): number {
    return this._age;
  }
  public set age(age: number) {
    validateNonNegative("age", age);
    this._age = age;
  }

  public get gender(): Gender {
    return this._gender;
  }
  public set gender(gender: Gender) {
    this._gender = gender;
  }

  public get heightCm(): number {
    return this._heightCm;
  }
  public set heightCm(heightCm: number) {
    validateNonNegative("heightCm", heightCm);
    this._heightCm = heightCm;
  }

  public get activityLevel(): ActivityLevel {
    return this._activityLevel;
  }
  public set activityLevel(activityLevel: ActivityLevel) {
    this._activityLevel = activityLevel;
  }

  public get medicalCondition(): MedicalCondition {
    return this._medicalCondition;
  }
  public set medicalCondition(medicalCondition: MedicalCondition) {
    this._medicalCondition = medicalCondition;
  }

  public get weightKg(): number {
    return this._weightKg;
  }
  public set weightKg(weightKg: number) {
    validateNonNegative("weightKg", weightKg);
    this._weightKg = weightKg;
  }

  public get motivation(): MotivationToTrackCalories {
    return this._motivation;
  }
  public set motivation(motivation: MotivationToTrackCalories) {
    this._motivation = motivation;
  }

  public get email(): string {
    return this._email;
  }
  public set email(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      this._email = email;
      return;
    }
    log.error("Invalid parameter email in user.ts.");
    throw new RangeError("Please enter a valid email address.");
  }

  public get password(): string {
    return this._password;
  }
  public set password(password: string) {
    this._password = password;
  }

  public get targetWeightKg(): number | undefined {
    return this._targetWeightKg;
  }
  public set targetWeightKg(targetWeightKg: number | undefined) {
    if (targetWeightKg !== undefined) {
      validateNonNegative("targetWeightKg", targetWeightKg);
    }
    this._targetWeightKg = targetWeightKg;
  }

  public get weightGoalType(): WeightGoalType | undefined {
    return this._weightGoalType;
  }
  public set weightGoalType(weightGoalType: WeightGoalType | undefined) {
    this._weightGoalType = weightGoalType;
  }

  public get weightLossRate(): WeightLossRate | undefined {
    return this._weightLossRate;
  }
  public set weightLossRate(weightLossRate: WeightLossRate | undefined) {
    this._weightLossRate = weightLossRate;
  }

  public get targetDate(): Date | undefined {
    return this._targetDate;
  }
  public set targetDate(targetDate: Date | undefined) {
    this._targetDate = targetDate;
  }

  public get bodyFatPercentage(): number | undefined {
    return this._bodyFatPercentage;
  }
  public set bodyFatPercentage(bodyFatPercentage: number | undefined) {
    if (
      bodyFatPercentage !== undefined &&
      (bodyFatPercentage < 0 || bodyFatPercentage > 100)
    ) {
      log.error("Invalid body fat percentage in user.ts.");
      throw new RangeError("Body fat percentage must be between 0 and 100.");
    }
    this._bodyFatPercentage = bodyFatPercentage;
  }

  public get proteinPreference(): "low" | "moderate" | "high" | undefined {
    return this._proteinPreference;
  }
  public set proteinPreference(
    proteinPreference: "low" | "moderate" | "high" | undefined,
  ) {
    this._proteinPreference = proteinPreference;
  }

  public get customCalories(): number | undefined {
    return this._customCalories;
  }
  public set customCalories(customCalories: number | undefined) {
    if (customCalories !== undefined)
      validateNonNegative("customCalories", customCalories);
    this._customCalories = customCalories;
  }

  public get customProtein(): number | undefined {
    return this._customProtein;
  }
  public set customProtein(customProtein: number | undefined) {
    if (customProtein !== undefined)
      validateNonNegative("customProtein", customProtein);
    this._customProtein = customProtein;
  }

  public get customCarbs(): number | undefined {
    return this._customCarbs;
  }
  public set customCarbs(customCarbs: number | undefined) {
    if (customCarbs !== undefined)
      validateNonNegative("customCarbs", customCarbs);
    this._customCarbs = customCarbs;
  }

  public get customFat(): number | undefined {
    return this._customFat;
  }
  public set customFat(customFat: number | undefined) {
    if (customFat !== undefined) validateNonNegative("customFat", customFat);
    this._customFat = customFat;
  }

  public get isCustomGoals(): boolean | undefined {
    return this._isCustomGoals;
  }
  public set isCustomGoals(isCustomGoals: boolean | undefined) {
    this._isCustomGoals = isCustomGoals;
  }

  public toJSON(): IUser {
    return {
      name: this._name,
      age: this._age,
      gender: this._gender,
      heightCm: this._heightCm,
      activityLevel: this._activityLevel,
      medicalCondition: this._medicalCondition,
      weightKg: this._weightKg,
      motivation: this._motivation,
      email: this._email,
      password: this._password,
      targetWeightKg: this._targetWeightKg,
      weightGoalType: this._weightGoalType,
      weightLossRate: this._weightLossRate,
      targetDate: this._targetDate,
      bodyFatPercentage: this._bodyFatPercentage,
      proteinPreference: this._proteinPreference,
      customCalories: this._customCalories,
      customProtein: this._customProtein,
      customCarbs: this._customCarbs,
      customFat: this._customFat,
      isCustomGoals: this._isCustomGoals,
    };
  }

  public static fromJSON(json: any): User {
    return new User({
      name: json.name,
      age: json.age,
      gender: json.gender ?? Gender.Male,
      heightCm: json.heightCm ?? json.height_cm ?? 175,
      activityLevel:
        json.activityLevel ?? json.activity_level ?? ActivityLevel.Sedentary,
      medicalCondition:
        json.medicalCondition ??
        json.medical_condition ??
        MedicalCondition.None,
      weightKg: json.weightKg ?? json.weight_kg,
      motivation: json.motivation,
      email: json.email,
      password: json.password ?? "", // Password is not returned by API
      targetWeightKg: json.targetWeightKg ?? json.target_weight_kg,
      weightGoalType: json.weightGoalType ?? json.weight_goal_type,
      weightLossRate: json.weightLossRate ?? json.weight_loss_rate,
      targetDate: json.targetDate
        ? new Date(json.targetDate)
        : json.target_date
          ? new Date(json.target_date)
          : undefined,
      bodyFatPercentage: json.bodyFatPercentage ?? json.body_fat_percentage,
      proteinPreference: json.proteinPreference ?? json.protein_preference,
      customCalories: json.customCalories ?? json.custom_calories,
      customProtein: json.customProtein ?? json.custom_protein,
      customCarbs: json.customCarbs ?? json.custom_carbs,
      customFat: json.customFat ?? json.custom_fat,
      isCustomGoals: json.isCustomGoals ?? json.is_custom_goals,
    });
  }
}
