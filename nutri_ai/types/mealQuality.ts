import log from "@/lib/logger";
import { validateNonNegative } from "@/lib/utils/validation";

export class MealQuality {
  // Calories per gram
  private _calorieDensity: number;
  // How well the meal fits a dietary goal (0-100%)
  private _goalFitPercentage: number;
  // Overall meal quality score (1-10)
  private _mealQualityScore: number;

  constructor(
    calorieDensity: number,
    goalFitPercentage: number,
    mealQualityScore: number,
  ) {
    validateNonNegative("calorieDensity", calorieDensity);
    this._calorieDensity = calorieDensity;

    if (goalFitPercentage < 0 || goalFitPercentage > 100) {
      log.error(
        "Invalid goal fit percentage value: must be between 0 and 100.",
      );
      throw new RangeError("Goal fit percentage must be between 0 and 100.");
    }
    this._goalFitPercentage = goalFitPercentage;

    if (mealQualityScore < 1 || mealQualityScore > 10) {
      log.error("Invalid meal quality score value: must be between 1 and 10.");
      throw new RangeError("Meal quality score must be between 1 and 10.");
    }
    this._mealQualityScore = mealQualityScore;
  }

  /**
   * Getters and Setters
   */
  public getCalorieDensity(): number {
    return this._calorieDensity;
  }

  public setCalorieDensity(calorieDensity: number): void {
    validateNonNegative("calorieDensity", calorieDensity);
    this._calorieDensity = calorieDensity;
  }

  public getGoalFitPercentage(): number {
    return this._goalFitPercentage;
  }

  public setGoalFitPercentage(goalFitPercentage: number): void {
    if (goalFitPercentage >= 0 && goalFitPercentage <= 100) {
      this._goalFitPercentage = goalFitPercentage;
      return;
    }
    log.error("Invalid goal fit percentage value: must be between 0 and 100.");
    throw new RangeError("Goal fit percentage must be between 0 and 100.");
  }

  public getMealQualityScore(): number {
    return this._mealQualityScore;
  }

  public setMealQualityScore(mealQualityScore: number): void {
    if (mealQualityScore >= 1 && mealQualityScore <= 10) {
      this._mealQualityScore = mealQualityScore;
      return;
    }
    log.error("Invalid meal quality score value: must be between 1 and 10.");
    throw new RangeError("Meal quality score must be between 1 and 10.");
  }

  public toJSON(): any {
    return {
      calorieDensity: this._calorieDensity,
      goalFitPercentage: this._goalFitPercentage,
      mealQualityScore: this._mealQualityScore,
    };
  }

  public static fromJSON(json: any): MealQuality {
    return new MealQuality(
      json.calorieDensity,
      json.goalFitPercentage,
      json.mealQualityScore,
    );
  }
}
