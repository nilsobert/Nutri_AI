import { validateNonNegative } from "@/lib/utils/validation";

export class NutritionInfo {
  private _calories: number;
  private _carbs: number;
  private _sugar: number;
  private _protein: number;
  private _fat: number;

  // Use shared validation util

  constructor(params: {
    calories: number;
    carbs: number;
    sugar: number;
    protein: number;
    fat: number;
  }) {
    validateNonNegative("calories", params.calories);
    validateNonNegative("carbs", params.carbs);
    validateNonNegative("sugar", params.sugar);
    validateNonNegative("protein", params.protein);
    validateNonNegative("fat", params.fat);

    this._calories = params.calories;
    this._carbs = params.carbs;
    this._sugar = params.sugar;
    this._protein = params.protein;
    this._fat = params.fat;
  }

  /**
   * Getters and Setters
   */
  public getCalories(): number {
    return this._calories;
  }
  public setCalories(calories: number): void {
    validateNonNegative("calories", calories);
    this._calories = calories;
  }

  public getCarbs(): number {
    return this._carbs;
  }
  public setCarbs(carbs: number): void {
    validateNonNegative("carbs", carbs);
    this._carbs = carbs;
  }

  public getSugar(): number {
    return this._sugar;
  }
  public setSugar(sugar: number): void {
    validateNonNegative("sugar", sugar);
    this._sugar = sugar;
  }

  public getProtein(): number {
    return this._protein;
  }
  public setProtein(protein: number): void {
    validateNonNegative("protein", protein);
    this._protein = protein;
  }

  public getFat(): number {
    return this._fat;
  }
  public setFat(fat: number): void {
    validateNonNegative("fat", fat);
    this._fat = fat;
  }

  public toJSON(): any {
    return {
      calories: this._calories,
      carbs: this._carbs,
      sugar: this._sugar,
      protein: this._protein,
      fat: this._fat,
    };
  }

  public static fromJSON(json: any): NutritionInfo {
    return new NutritionInfo({
      calories: json.calories,
      carbs: json.carbs,
      sugar: json.sugar,
      protein: json.protein,
      fat: json.fat,
    });
  }
}
