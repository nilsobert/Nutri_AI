import openai
import os
import base64
from PIL import Image
import io
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def compress_and_encode_image(image_path, max_size=(1200, 900), quality=90):
    """Compress and encode image to base64 string with reduced size"""
    # Open and resize image
    with Image.open(image_path) as img:
        # Convert to RGB if necessary (removes alpha channel)
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        
        # Resize if larger than max_size while maintaining aspect ratio
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save to bytes with compression
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=quality, optimize=True)
        buffer.seek(0)
        
        return base64.b64encode(buffer.getvalue()).decode('utf-8')

client = openai.OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL")
)

image_path = os.getenv("IMAGE_PATH")

# Compress and encode the image
base64_image = compress_and_encode_image(image_path)

json_schema_template = """
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
        "sugar_g": 0,
        "fiber_g": 0
      }
    },
    {
      "name": "Steamed Broccoli",
      "confidence": 0.88,
      "serving_size_grams": 100,
      "nutrition": {
        "calories": 34,
        "protein_g": 2.8,
        "fat_g": 0.4,
        "carbohydrates_g": 6.6,
        "sugar_g": 1.7,
        "fiber_g": 2.6
      }
    }
  ],
  "errorMessage": null
}
"""

chat_response = client.chat.completions.create(
    model="Qwen2.5-VL-72B-Instruct",
    messages=[
        {
            "role": "system", 
            "content": "You are an expert nutrition assistant. Your task is to accurately identify all food items in the provided image, estimate their serving size in grams, and calculate their complete nutritional information. You must respond only with the requested JSON object."
        },
        {
            "role": "user", 
            "content": [
                {
                    "type": "text",
                    "text": f"""Analyze the attached meal image and provide a detailed nutritional breakdown. Identify each distinct food item, estimate its weight in grams, and list its core nutritional facts.

Return a JSON object matching this exact schema:
{json_schema_template}

RULES:
- `success`: Set to `true` if food is found, `false` otherwise.
- `requestId`: Generate a unique ID for this analysis (e.g., "img_analysis_...").
- `items`: Create one object for *each* distinct food item in the image. If there are three items, this array should have three objects.
- `confidence`: Your confidence (0.0 to 1.0) in the item's identification.
- `serving_size_grams`: Your best estimate of the item's weight in grams. This is critical.
- `nutrition`: The nutritional info for that *single item* based on its estimated serving size.
- `errorMessage`: Set to a reason (e.g., 'No food detected', 'Image blurry') if `success` is `false`, otherwise leave as `null`.

Return *only* the JSON object and nothing else."""
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}"
                    }
                }
            ]
        }
    ],
    temperature=0.0, # Set to 0.0 for deterministic, fact-based JSON output
    max_tokens=2048 # Increase to handle complex meals with multiple items
)

# Print the response
print(chat_response.choices[0].message.content)
