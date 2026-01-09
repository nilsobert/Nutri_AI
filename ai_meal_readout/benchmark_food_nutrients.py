import time
import os
import json
import random
import tempfile
import statistics
import io
import pandas as pd
import numpy as np
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import List, Dict, Any, Optional

from datasets import load_dataset
from dotenv import load_dotenv
from PIL import Image

from ai_meal_analyzer import analyze_meal_image

load_dotenv()

@dataclass
class GroundTruthMeal:
    image: Any
    calories: float
    carbs: float
    protein: float
    fat: float
    total_mass: Optional[float] = None
    dataset_index: Optional[int] = None

    def to_dict_no_image(self):
        return {k: v for k, v in asdict(self).items() if k != 'image'}

@dataclass
class PredictedMeal:
    calories: float
    carbs: float
    protein: float
    fat: float
    total_mass: Optional[float] = None

@dataclass
class MealError:
    calories: Dict[str, float]
    carbs: Dict[str, float]
    protein: Dict[str, float]
    fat: Dict[str, float]

# --- Helper Functions ---

def load_food_nutrients_dataset(subset_size: int = 30, seed: int = 42) -> List[GroundTruthMeal]:
    random.seed(seed)
    images_ds = load_dataset("mmathys/food-nutrients", split="test")
    metadata_ds = load_dataset("mmathys/food-nutrients", data_files="metadata.jsonl", split="train")
    meta_df = metadata_ds.to_pandas()
    
    indices = list(range(len(images_ds)))
    random.shuffle(indices)
    selected_indices = indices[:subset_size]

    meals = []
    for idx in selected_indices:
        img_item = images_ds[idx]
        meta_item = meta_df.iloc[idx]
        meals.append(GroundTruthMeal(
            image=img_item['image'],
            calories=float(meta_item['total_calories']),
            carbs=float(meta_item['total_carb']),
            protein=float(meta_item['total_protein']),
            fat=float(meta_item['total_fat']),
            total_mass=float(meta_item['total_mass']) if 'total_mass' in meta_item else None,
            dataset_index=idx
        ))
    return meals

def save_image_to_temp(image: Any) -> str:
    temp_fd, temp_path = tempfile.mkstemp(suffix='.jpg')
    os.close(temp_fd)
    if isinstance(image, Image.Image):
        image.save(temp_path, 'JPEG')
    else:
        with open(temp_path, 'wb') as f:
            f.write(image if isinstance(image, bytes) else io.BytesIO(image).read())
    return temp_path

def aggregate_predicted_nutrition(items: List[Dict[str, Any]]) -> PredictedMeal:
    total_cal = sum(float(i.get("nutrition", {}).get("calories", 0) or 0) for i in items)
    total_pro = sum(float(i.get("nutrition", {}).get("protein_g", 0) or 0) for i in items)
    total_fat = sum(float(i.get("nutrition", {}).get("fat_g", 0) or 0) for i in items)
    total_carb = sum(float(i.get("nutrition", {}).get("carbohydrates_g", 0) or 0) for i in items)
    return PredictedMeal(calories=total_cal, carbs=total_carb, protein=total_pro, fat=total_fat)

def calculate_meal_errors(predicted: PredictedMeal, ground_truth: GroundTruthMeal) -> MealError:
    def calc_errors(pred: float, truth: float) -> Dict[str, float]:
        abs_err = abs(pred - truth)
        return {
            "absolute_error": abs_err,
            "percentage_error": (abs_err / truth * 100) if truth > 0 else 0.0,
            "squared_error": (pred - truth) ** 2
        }
    return MealError(
        calories=calc_errors(predicted.calories, ground_truth.calories),
        carbs=calc_errors(predicted.carbs, ground_truth.carbs),
        protein=calc_errors(predicted.protein, ground_truth.protein),
        fat=calc_errors(predicted.fat, ground_truth.fat)
    )

def aggregate_nutrient_metrics(all_meal_errors: List[MealError]) -> Dict[str, Dict[str, float]]:
    def aggregate(errors_list: List[Dict[str, float]]) -> Dict[str, float]:
        if not errors_list: return {"mae": 0.0, "mape": 0.0, "rmse": 0.0}
        abs_vals = [e["absolute_error"] for e in errors_list]
        pct_vals = [e["percentage_error"] for e in errors_list]
        sq_vals = [e["squared_error"] for e in errors_list]
        return {
            "mae": statistics.mean(abs_vals),
            "mape": statistics.mean(pct_vals),
            "rmse": np.sqrt(statistics.mean(sq_vals))
        }
    return {
        "calories": aggregate([e.calories for e in all_meal_errors]),
        "carbs": aggregate([e.carbs for e in all_meal_errors]),
        "protein": aggregate([e.protein for e in all_meal_errors]),
        "fat": aggregate([e.fat for e in all_meal_errors])
    }

# --- Core Logic ---

def evaluate_models(models: List[str], test_cases: List[GroundTruthMeal]) -> Dict[str, Any]:
    results = {"timestamp": datetime.now().isoformat(), "subset_size": len(test_cases), "models": {}}
    
    for model_name in models:
        model_results = {"model_name": model_name, "total_tests": len(test_cases), "successful_analyses": 0, "failed_analyses": 0, "meal_results": []}
        meal_errors_list = []
        
        for idx, gt in enumerate(test_cases):
            print(f"[{model_name}] Analyzing meal {idx+1}/{len(test_cases)}...", end=" ", flush=True)
            temp_path = save_image_to_temp(gt.image)
            
            # Retry logic for rate limits
            analysis = None
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    analysis = analyze_meal_image(temp_path, model_name=model_name)
                    if analysis.get("success"):
                        break
                    else:
                        print(f"(Attempt {attempt+1} failed, retrying...)", end=" ")
                        time.sleep(5 * (attempt + 1)) # Wait longer each time
                except Exception as e:
                    time.sleep(5)
            
            if os.path.exists(temp_path): os.unlink(temp_path)

            if analysis and analysis.get("success") and analysis.get("items"):
                pred = aggregate_predicted_nutrition(analysis["items"])
                err = calculate_meal_errors(pred, gt)
                meal_errors_list.append(err)
                model_results["successful_analyses"] += 1
                model_results["meal_results"].append({
                    "index": idx, "predicted": asdict(pred), "ground_truth": gt.to_dict_no_image(), "errors": asdict(err)
                })
                print("✅")
            else:
                model_results["failed_analyses"] += 1
                print("❌")

            # Mandatory small delay between requests to stay under rate limits
            time.sleep(2) 
        
        if meal_errors_list:
            model_results["nutrient_metrics"] = aggregate_nutrient_metrics(meal_errors_list)
        results["models"][model_name] = model_results
        
    return results

def print_console_report(results: Dict[str, Any]):
    print("\n" + "="*50)
    print("FINAL BENCHMARK METRICS")
    print("="*50)
    for model_name, data in results["models"].items():
        print(f"\nMODEL: {model_name}")
        print(f"Success: {data['successful_analyses']}/{data['total_tests']}")
        
        if data.get("nutrient_metrics"):
            m = data["nutrient_metrics"]
            print(f"{'Nutrient':<12} | {'MAE':<8} | {'MAPE':<8} | {'RMSE':<8}")
            print("-" * 45)
            for nut in ["calories", "protein", "carbs", "fat"]:
                print(f"{nut.capitalize():<12} | {m[nut]['mae']:<8.2f} | {m[nut]['mape']:<8.2f}% | {m[nut]['rmse']:<8.2f}")
    print("="*50 + "\n")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--subset-size", type=int, default=30)
    parser.add_argument("--models", nargs="+", default=["Qwen2.5-VL-72B-Instruct"])
    args = parser.parse_args()
    
    test_cases = load_food_nutrients_dataset(subset_size=args.subset_size)
    results = evaluate_models(args.models, test_cases)
    
    # Save JSON
    with open("benchmark_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    # Print nice table to console
    print_console_report(results)