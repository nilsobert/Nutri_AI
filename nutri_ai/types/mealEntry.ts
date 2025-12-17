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

export class MealEntry {
  private readonly _id: string;
  // Unix timestamp
  private readonly _timestamp: number;
  private _category: MealCategory;
  // Path to stored image
  private _image?: string;
  private _transcription?: string;
  private _mealQuality: MealQuality;
  private _nutritionInfo: NutritionInfo;

  constructor(
    category: MealCategory,
    mealQuality: MealQuality,
    nutritionInfo: NutritionInfo,
    image?: string,
    transcription?: string,
    timestamp?: number,
    id?: string,
  ) {
    this._id = id || uuidv4();
    this._timestamp = timestamp || Math.floor(Date.now() / MS_TO_S);
    this._category = category;
    this._mealQuality = mealQuality;
    this._nutritionInfo = nutritionInfo;
    this._image = image;
    this._transcription = transcription;
  }

  /**
   * Getters and Setters
   */
  public getId(): string {
    return this._id;
  }

  public getTimestamp(): number {
    return this._timestamp;
  }

  public getCategory(): MealCategory {
    return this._category;
  }

  public setCategory(category: MealCategory): void {
    this._category = category;
  }

  public getImage(): string | undefined {
    return this._image;
  }

  public setImage(image: string | undefined): void {
    this._image = image;
  }

  public getTranscription(): string | undefined {
    return this._transcription;
  }

  public setTranscription(transcription: string | undefined): void {
    this._transcription = transcription;
  }

  public getMealQuality(): MealQuality {
    return this._mealQuality;
  }

  public setMealQuality(mealQuality: MealQuality): void {
    this._mealQuality = mealQuality;
  }

  public getNutritionInfo(): NutritionInfo {
    return this._nutritionInfo;
  }

  public setNutritionInfo(nutritionInfo: NutritionInfo): void {
    this._nutritionInfo = nutritionInfo;
  }

  public toJSON(): any {
    return {
      id: this._id,
      timestamp: this._timestamp,
      category: this._category,
      image: this._image,
      transcription: this._transcription,
      mealQuality: this._mealQuality,
      nutritionInfo: this._nutritionInfo,
    };
  }

  public static fromJSON(json: any): MealEntry {
    return new MealEntry(
      json.category,
      MealQuality.fromJSON(json.mealQuality),
      NutritionInfo.fromJSON(json.nutritionInfo),
      json.image,
      json.transcription,
      json.timestamp,
      json.id,
    );
  }
}
