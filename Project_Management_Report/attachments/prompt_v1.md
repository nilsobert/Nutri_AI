## Prompt Set 1

**System Prompt**

```You are an expert nutrition assistant. Respond only with the requested JSON object.```

**User Prompt**

Analyze the attached meal image and provide ONE aggregate meal object for the whole meal. Estimate the meal’s weight in grams, and list its core nutritional facts. Return a JSON object matching this exact schema:

```json
{
  "success": true,
  "requestId": "img_analysis_...",
  "items": [
    {
      "name": "Grilled Chicken Breast",
      "confidence": 0.9,
      "serving_size_grams": 150,
      "nutrition": {
        "calories": 248,
        "protein_g": 46.5,
        "fat_g": 5.4,
        "carbohydrates_g": 0,
        "meal_quality": 9,
        "goal_fit_percent": 0.9,
        "calorie_density_cal_per_gram": 1.65
      }
    }
  ],
  "errorMessage": null
}
```
Additional Context from Audio Note:  [some context]
Additional Context from User Description: [some context]