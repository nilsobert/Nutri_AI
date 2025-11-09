import { MS_TO_S } from "@/constants/values"
import { MealEntry } from "./mealEntry"
import { NutritionInfo } from "./nutritionInfo"

export class Day {
    private readonly _timestamp: number;
    private _mealEntries: MealEntry[];
    private _targetConsumption: NutritionInfo;

    constructor(targetConsumption: NutritionInfo) 
    {
        this._timestamp = Math.floor(Date.now() / MS_TO_S);
        this._mealEntries = [];
        this._targetConsumption = targetConsumption;
    }

    /**
    * Getters and Setters
    */
    public getTimestamp(): number {
        return this._timestamp;
    }

    public getMealEntries(): MealEntry[] {
        return this._mealEntries;
    }

    public addMealEntry(mealEntry: MealEntry) {
        if(mealEntry != null)
        {
            this._mealEntries.push(mealEntry);
        }
        
    }

    public getTargetConsumption(): NutritionInfo {
        return this._targetConsumption;
    }

    public setTargetConsumption(targetConsumption: NutritionInfo) {
        this._targetConsumption = targetConsumption;
    }
}
